FROM node:20

# Set timezone
ARG TZ=America/Los_Angeles
ENV TZ=$TZ
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install base dependencies required for Claude Code security features
RUN apt-get update && apt-get install -y \
    git \
    zsh \
    sudo \
    fzf \
    iptables \
    ipset \
    iproute2 \
    dnsutils \
    less \
    procps \
    unzip \
    jq \
    nano \
    vim \
    curl \
    wget \
    # Additional tools for SlideHeroes development
    postgresql-client \
    redis-tools \
    httpie \
    netcat-openbsd \
    htop \
    ncdu \
    tree \
    ripgrep \
    fd-find \
    bat \
    tmux \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install git-delta for better git diffs
ARG GIT_DELTA_VERSION=0.18.2
RUN wget -q https://github.com/dandavison/delta/releases/download/$GIT_DELTA_VERSION/git-delta_${GIT_DELTA_VERSION}_amd64.deb \
    && dpkg -i git-delta_${GIT_DELTA_VERSION}_amd64.deb \
    && rm git-delta_${GIT_DELTA_VERSION}_amd64.deb

# Install Oh My Zsh with Powerlevel10k theme (as root)
ARG ZSH_IN_DOCKER_VERSION=1.2.0
RUN sh -c "$(wget -qO- https://github.com/deluan/zsh-in-docker/releases/download/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
    -t https://github.com/romkatv/powerlevel10k \
    -p git \
    -p docker \
    -p docker-compose \
    -p node \
    -p npm \
    -p yarn \
    -p zsh-autosuggestions \
    -p zsh-syntax-highlighting \
    -p zsh-completions \
    -p history-substring-search

# Set up the node user (already exists in node:20 image)
# Grant passwordless sudo for development container
RUN usermod -s /bin/zsh node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Install global npm packages and enable pnpm (as root)
RUN npm install -g \
    @biomejs/biome \
    turbo \
    npm-check-updates \
    serve \
    concurrently \
    wait-on \
    cross-env \
    dotenv-cli \
    tsx \
    @modelcontextprotocol/sdk \
    @anthropic-ai/sdk \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Create necessary directories and copy zsh config to node user
RUN mkdir -p /home/node/.zsh_history_dir \
    && mkdir -p /home/node/.claude \
    && mkdir -p /workspace \
    && mkdir -p /home/node/.npm-global \
    && cp -r /root/.oh-my-zsh /home/node/ 2>/dev/null || true \
    && cp /root/.zshrc /home/node/ 2>/dev/null || true \
    && cp -r /root/.p10k.zsh /home/node/ 2>/dev/null || true \
    && chown -R node:node /home/node /workspace

# Switch to node user
USER node
WORKDIR /home/node

# Configure shell and environment
RUN echo 'export PATH="/workspace/node_modules/.bin:$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc \
    && echo 'export EDITOR="code --wait"' >> ~/.zshrc \
    && echo 'export GIT_PROMPT_SHOW_UNTRACKED_FILES=no' >> ~/.zshrc \
    && echo 'export HISTFILE=/home/node/.zsh_history_dir/.zsh_history' >> ~/.zshrc \
    && echo 'export HISTSIZE=10000' >> ~/.zshrc \
    && echo 'export SAVEHIST=10000' >> ~/.zshrc \
    && echo 'setopt SHARE_HISTORY' >> ~/.zshrc \
    && echo 'setopt HIST_IGNORE_DUPS' >> ~/.zshrc \
    && echo 'setopt HIST_IGNORE_ALL_DUPS' >> ~/.zshrc \
    && echo 'setopt HIST_FIND_NO_DUPS' >> ~/.zshrc

# Add SlideHeroes specific aliases
RUN echo '# SlideHeroes Development Aliases' >> ~/.zshrc \
    && echo 'alias db="psql postgresql://postgres:postgres@localhost:54322/postgres"' >> ~/.zshrc \
    && echo 'alias supabase-start="cd /workspace/apps/web && npx supabase start && cd -"' >> ~/.zshrc \
    && echo 'alias supabase-stop="cd /workspace/apps/web && npx supabase stop && cd -"' >> ~/.zshrc \
    && echo 'alias supabase-reset="cd /workspace/apps/web && npx supabase db reset && cd -"' >> ~/.zshrc \
    && echo 'alias dev="pnpm dev"' >> ~/.zshrc \
    && echo 'alias test="pnpm test"' >> ~/.zshrc \
    && echo 'alias build="pnpm build"' >> ~/.zshrc \
    && echo 'alias lint="pnpm lint"' >> ~/.zshrc \
    && echo 'alias typecheck="pnpm typecheck"' >> ~/.zshrc \
    && echo 'alias web="cd /workspace/apps/web"' >> ~/.zshrc \
    && echo 'alias root="cd /workspace"' >> ~/.zshrc \
    && echo 'alias gs="git status"' >> ~/.zshrc \
    && echo 'alias gd="git diff"' >> ~/.zshrc \
    && echo 'alias gc="git commit"' >> ~/.zshrc \
    && echo 'alias gp="git push"' >> ~/.zshrc \
    && echo 'alias gl="git log --oneline -10"' >> ~/.zshrc

# Configure git and npm for node user
RUN git config --global core.editor "code --wait" \
    && git config --global init.defaultBranch main \
    && git config --global safe.directory /workspace \
    && npm config set prefix ~/.npm-global

# Configure bat (better cat)
RUN mkdir -p ~/.config/bat \
    && echo '--theme="Visual Studio Dark+"' > ~/.config/bat/config

# Install Claude Code CLI (if available)
ARG CLAUDE_CODE_VERSION=latest
RUN if [ "$CLAUDE_CODE_VERSION" != "skip" ]; then \
    npm install -g @anthropic/claude-code@${CLAUDE_CODE_VERSION} || echo "Claude Code CLI not available yet"; \
    fi

WORKDIR /workspace

# Set default command
CMD ["zsh"]