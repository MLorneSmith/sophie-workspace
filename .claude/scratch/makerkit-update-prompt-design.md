The project uses a SaaS Starter kit code repository called makerkit.

I want to design a claude code command that will pull updates from the makerkit repo and apply them to the local repo. The makerkit project is located at upstream so we need to use:

git pull upstream main

As part of the command we need to unsure that there are no uncomitted changes before updatingh.

We often run into merge conflicts when updating the makerkit code. So this command also needs to ensure that all merge conflicts are resolved.

Save this copmmand in the file .claude/commands/update-makerkit.md
