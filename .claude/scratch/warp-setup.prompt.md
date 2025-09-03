# Warp Terminal / Github Codespaces integration

I want to setup my Warp terminal so that when I launch Warp it opens three tabs automatically:
1. 'Pointed at' / logged into my local 2025slideheroes project / dev branch
2. 'Pointed at' / logged into my first github codespace
3. 'Pointed at' / logged into my second github codespace

## Requirements

1. We need a solution for how to manage when a codespace is replaced or updated (and the name of the codespace changes). It is unclear to me how often a codespace will need to be rebuilt. As we have been implementing codespaces, I have found that I often need to delete an existing codespace and build a new one to ensure changes are captured. I will need a recommendation on how to deal with updating codespaces going forward as we continue development (and how to manage changing codespace names).
2. Automatic SSH into the codespaces
3. Each Warp tab named and colored
- dev
- codespace (first word of codespace name)
- codespace (first word od codespace name)
4. New context file written for an LLM coding assistant that describes the full codespaces / Warp setup, including a description of what the scripts in ~/.local/bin/ do. 

## Your task

1. Use the research-analyst agent to read Warp documentation and conduct additional research
2. Provide a recommendation on how to manage updaing or rebuilding codespaces going forward  
3. Review all related scripts in ~/.local/bin/
4. Develop a plan to set up Warp correctly. Use the /log
5. Create context file. Put the new context file file in .claude/context/systems/devcontainer-codespaces