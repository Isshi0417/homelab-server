# Modern Configuration with Ansible Navigator & Dev Containers

[← Back to Main README](../README.md)

This section details the configuration management architecture, including development environments, secure credential storage, and execution using Ansible Navigator.

---

## 1. Development Containers (VS Code Dev Containers)

To build a professional environment, I avoided installing devloper dependencies directly on the local laptop. Instead, I used **VS Code Dev Containers** powered by Podman.

### The Container Stack:

*   **The Image:** [registry.redhat.io/ansible-automation-platform-25/ansible-dev-tools-rhel8:latest]()
*   **Why:** This official Red Hat container provides a standardiezed, pre-configured development environment containing:
    *   Ansible Core and Ansible Lint
    *   Ansible Navigator
    *   Common system administration collections
*   **Benefits:** This prevents "dependency drift." Any developer who opens this workspace in VS Code gets the exact same versions of Python, Ansible, and system libraries, preventing configuration discrepancies.

---

## 2. SSH Agent Forwarding

When running Ansible inside a container, the container needs a way to SSH into the target virtual machines.

### The Security Dilemma

*   **Bad Practice:** Copying my private SSH key (~/.ssh/id_ed25519) inside the container. If the container or image is exported, my private key is exposed.
*   **Best Practice (SSH Agent Forwarding):**
    1. My private key is loaded into the **SSH Agent** running on my host laptop.
    2. VS Code mounts the agent's Unix socket (SSH_AUTH_SOCK) directly inside the Dev Container.
    3. When Ansible runs an SSH command, it queries the forwarded socket. The laptop host performs the cryptographic handshake, allowing the container to authenticate without ever seeing or storing the private key files on its disk.

---

## 3. Secrets Management with Ansible Vault

For security, I cannot commit plain-text credentials (like Red Hat Customer Portal usernames and passwords) to a public GitHub repository.

### The Implementation:

I created an external variables file vault.yml containing my sensitive data and encrypted it using **Ansible Vault:**

```bash
    ansible-vault encrypt vault.yml
```

*   **Encryption Standard:** Ansible Vault uses AES-256 encryption.
*   **Decryption:** The file is completely scrambled on disk. When playbooks are executed, `--ask-vault-pass` flag can be passed. Ansible prompts for the master password, decrypts the variables directly in memory, runs the tasks, and discards the plaintext variables immediately when finished.

---

## 4. Running Ansible Navigator Locally

Ansible Navigator is designed to pull and run playbooks inside separate Execution Environment (EE) containers on the host.

### The Nested Container Conflict:

Because I am already runnin ginside a Dev Container, trying to launch another container inside it (nested Podman-in-Podman containerization) is slow, resource-heavy, and causes permission issues.

### The Solution:

I disabled the nested execution environment flag using `--ee false`:

```bash
    ansible-navigator run configure_nodes.yml --mode stdout --ee false
```

*   **--ee false:** Forces ansible-navigator to run playbooks directly inside the current Dev Container shell, using the pre-installed tools and collections, bypassing the nested container layer.
*   **--mode stdout:** Standardizes the console output to log directly to the terminal line-by-line, matching the traditional ansible-playbook output format.