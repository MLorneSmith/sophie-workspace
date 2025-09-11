# Improving our Calude Code Reports feature 
Our .claude system has a system for creating and then saving reports. The target directory for these reports is: /reports

## Current issue
Currently, it appears our system is saving all reports to the root of /reports. Over time this is going to become very disorganized. We need to design a subdirectory structure to keep reports organized

## Your task
1. Review CLAUDE.md for reference to reports 
2. Review our .claude system and identify what commands, agents and hooks use reports
3. Determine an approach for better organizing the report output. Get feedback from user on proposed directory structure
4. Identify all files that would need to be updated to store reports in a more organized way
5. Make a recommendation for improving how reports work