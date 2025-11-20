#!/usr/bin/env -S uv run
# /// script
# dependencies = ["python-dotenv", "pydantic"]
# ///

"""
ADW Plan - AI Developer Workflow for agentic planning

Usage:
  uv run adw_plan.py <issue-number> [adw-id]

Workflow:
1. Fetch GitHub issue details
2. Classify issue type (/chore, /bug, /feature)
3. Create feature branch
4. Generate implementation plan
5. Commit plan
6. Push and create/update PR
"""

import sys
import os
import logging
import json
from typing import Optional
from dotenv import load_dotenv

from adw_modules.state import ADWState
from adw_modules.git_ops import create_branch, commit_changes, finalize_git_operations
from adw_modules.github import (
    fetch_issue,
    make_issue_comment,
    get_repo_url,
    extract_repo_path,
)
from adw_modules.workflow_ops import (
    classify_issue,
    build_plan,
    build_bug_plan,
    run_diagnosis,
    generate_branch_name,
    create_commit,
    format_issue_message,
    ensure_adw_id,
    AGENT_PLANNER,
    AGENT_DIAGNOSTICIAN,
)
from adw_modules.utils import setup_logger
from adw_modules.data_types import GitHubIssue, IssueClassSlashCommand


def validate_adw_prefix(issue: GitHubIssue) -> bool:
    """Check if issue title starts with 'ADW:' prefix (case-insensitive)."""
    return issue.title.strip().upper().startswith("ADW:")


def check_env_vars(logger: Optional[logging.Logger] = None) -> None:
    """Check that all required environment variables are set."""
    required_vars = [
        "ANTHROPIC_API_KEY",
        "CLAUDE_CODE_PATH",
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        error_msg = "Error: Missing required environment variables:"
        if logger:
            logger.error(error_msg)
            for var in missing_vars:
                logger.error(f"  - {var}")
        else:
            print(error_msg, file=sys.stderr)
            for var in missing_vars:
                print(f"  - {var}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main entry point."""
    # Load environment variables
    load_dotenv()

    # Parse command line args
    if len(sys.argv) < 2:
        print("Usage: uv run adw_plan.py <issue-number> [adw-id]")
        sys.exit(1)

    issue_number = sys.argv[1]
    adw_id = sys.argv[2] if len(sys.argv) > 2 else None

    # Ensure ADW ID exists with initialized state
    temp_logger = setup_logger(adw_id, "adw_plan") if adw_id else None
    adw_id = ensure_adw_id(issue_number, adw_id, temp_logger)

    # Load the state that was created/found by ensure_adw_id
    state = ADWState.load(adw_id, temp_logger)

    # Ensure state has the adw_id field
    if not state.get("adw_id"):
        state.update(adw_id=adw_id)

    # Set up logger with ADW ID
    logger = setup_logger(adw_id, "adw_plan")
    logger.info(f"ADW Plan starting - ID: {adw_id}, Issue: {issue_number}")

    # Validate environment
    check_env_vars(logger)

    # Get repo information
    try:
        github_repo_url = get_repo_url()
        repo_path = extract_repo_path(github_repo_url)
    except ValueError as e:
        logger.error(f"Error getting repository URL: {e}")
        sys.exit(1)

    # Fetch issue details
    issue: GitHubIssue = fetch_issue(issue_number, repo_path)

    logger.debug(f"Fetched issue: {issue.model_dump_json(indent=2, by_alias=True)}")

    # Validate ADW: prefix in issue title
    if not validate_adw_prefix(issue):
        error_msg = "not an ADW workflow request"
        logger.error(f"Issue #{issue_number}: {error_msg}")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, "ops", f"❌ {error_msg}. Issue title must start with 'ADW:' prefix."),
        )
        sys.exit(1)

    make_issue_comment(
        issue_number, format_issue_message(adw_id, "ops", "✅ Starting planning phase")
    )

    make_issue_comment(
        issue_number,
        f"{adw_id}_ops: 🔍 Using state\n```json\n{json.dumps(state.data, indent=2)}\n```",
    )

    # Classify the issue
    issue_command, error = classify_issue(issue, adw_id, logger)

    if error:
        logger.error(f"Error classifying issue: {error}")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, "ops", f"❌ Error classifying issue: {error}"),
        )
        sys.exit(1)

    state.update(issue_class=issue_command)
    state.save("adw_plan")
    logger.info(f"Issue classified as: {issue_command}")
    make_issue_comment(
        issue_number,
        format_issue_message(adw_id, "ops", f"✅ Issue classified as: {issue_command}"),
    )

    # Generate branch name
    branch_name, error = generate_branch_name(issue, issue_command, adw_id, logger)

    if error:
        logger.error(f"Error generating branch name: {error}")
        make_issue_comment(
            issue_number,
            format_issue_message(
                adw_id, "ops", f"❌ Error generating branch name: {error}"
            ),
        )
        sys.exit(1)

    # Create git branch
    success, error = create_branch(branch_name)

    if not success:
        logger.error(f"Error creating branch: {error}")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, "ops", f"❌ Error creating branch: {error}"),
        )
        sys.exit(1)

    state.update(branch_name=branch_name)
    state.save("adw_plan")
    logger.info(f"Working on branch: {branch_name}")
    make_issue_comment(
        issue_number,
        format_issue_message(adw_id, "ops", f"✅ Working on branch: {branch_name}"),
    )

    # Build the implementation plan
    # For bugs, run diagnosis first, then bug-plan
    if issue_command == "/bug":
        # Step 1: Run diagnosis
        logger.info("Running bug diagnosis")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, AGENT_DIAGNOSTICIAN, "🔍 Running bug diagnosis"),
        )

        diagnosis_response = run_diagnosis(issue, adw_id, logger)

        if not diagnosis_response.success:
            logger.error(f"Error running diagnosis: {diagnosis_response.output}")
            make_issue_comment(
                issue_number,
                format_issue_message(
                    adw_id, AGENT_DIAGNOSTICIAN, f"❌ Error running diagnosis: {diagnosis_response.output}"
                ),
            )
            sys.exit(1)

        diagnosis_file = diagnosis_response.output.strip()
        logger.info(f"Diagnosis file created: {diagnosis_file}")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, AGENT_DIAGNOSTICIAN, f"✅ Diagnosis complete: {diagnosis_file}"),
        )

        # Update state with diagnosis file
        state.update(diagnosis_file=diagnosis_file)
        state.save("adw_plan")

        # Step 2: Build bug fix plan from diagnosis
        logger.info("Building bug fix plan from diagnosis")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, AGENT_PLANNER, "✅ Building bug fix plan from diagnosis"),
        )

        plan_response = build_bug_plan(issue, diagnosis_file, adw_id, logger)
    else:
        # For features and chores, use standard build_plan
        logger.info("Building implementation plan")
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, AGENT_PLANNER, "✅ Building implementation plan"),
        )

        plan_response = build_plan(issue, issue_command, adw_id, logger)

    if not plan_response.success:
        logger.error(f"Error building plan: {plan_response.output}")
        make_issue_comment(
            issue_number,
            format_issue_message(
                adw_id, AGENT_PLANNER, f"❌ Error building plan: {plan_response.output}"
            ),
        )
        sys.exit(1)

    logger.debug(f"Plan response: {plan_response.output}")
    make_issue_comment(
        issue_number,
        format_issue_message(adw_id, AGENT_PLANNER, "✅ Implementation plan created"),
    )

    # Get the plan file path directly from response
    logger.info("Getting plan file path")
    plan_file_path = plan_response.output.strip()
    
    # Validate the path exists
    if not plan_file_path:
        error = "No plan file path returned from planning agent"
        logger.error(error)
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, "ops", f"❌ {error}"),
        )
        sys.exit(1)
    
    if not os.path.exists(plan_file_path):
        error = f"Plan file does not exist: {plan_file_path}"
        logger.error(error)
        make_issue_comment(
            issue_number,
            format_issue_message(adw_id, "ops", f"❌ {error}"),
        )
        sys.exit(1)

    state.update(plan_file=plan_file_path)
    state.save("adw_plan")
    logger.info(f"Plan file created: {plan_file_path}")
    make_issue_comment(
        issue_number,
        format_issue_message(adw_id, "ops", f"✅ Plan file created: {plan_file_path}"),
    )

    # Create commit message
    logger.info("Creating plan commit")
    commit_msg, error = create_commit(
        AGENT_PLANNER, issue, issue_command, adw_id, logger
    )

    if error:
        logger.error(f"Error creating commit message: {error}")
        make_issue_comment(
            issue_number,
            format_issue_message(
                adw_id, AGENT_PLANNER, f"❌ Error creating commit message: {error}"
            ),
        )
        sys.exit(1)

    # Commit the plan
    success, error = commit_changes(commit_msg)

    if not success:
        logger.error(f"Error committing plan: {error}")
        make_issue_comment(
            issue_number,
            format_issue_message(
                adw_id, AGENT_PLANNER, f"❌ Error committing plan: {error}"
            ),
        )
        sys.exit(1)

    logger.info(f"Committed plan: {commit_msg}")
    make_issue_comment(
        issue_number, format_issue_message(adw_id, AGENT_PLANNER, "✅ Plan committed")
    )

    # Finalize git operations (push and PR)
    finalize_git_operations(state, logger)

    logger.info("Planning phase completed successfully")
    make_issue_comment(
        issue_number, format_issue_message(adw_id, "ops", "✅ Planning phase completed")
    )

    # Save final state
    state.save("adw_plan")
    
    # Post final state summary to issue
    make_issue_comment(
        issue_number,
        f"{adw_id}_ops: 📋 Final planning state:\n```json\n{json.dumps(state.data, indent=2)}\n```"
    )


if __name__ == "__main__":
    main()
