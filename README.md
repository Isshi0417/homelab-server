# Enterprise Hybird IaC Homelab: RHEL 10, KVM, Terraform & Ansible

An enterprise-grade, multi-tier virtualization homelab simulating a modern private cloud deployment. This project demonstrates Infrastructure as Code (IaC) provisioning and configuration management on a bare-metal Red Hat Enterprise Linux (RHEL) 10 hypervisor.

---

## 1. Project Purpose & Engineering Goals

In modern enterprise IT, infrastructure is no longer managed manually. The shift toward Cloud Native and DevSecOps models requires systems engineers to manage physical and virtual environments dynamically, safely, and repeatably.

The primary object of this project is to build a fully automated private cloud environment from a bare-metal baseline, demonstrating:
*   **Declarative Infrastructure:** Deploying virutal machines in a reproducible state using Terraform.
*   **Immutable Configuration:** Utilizing containerized Ansible Execution Environments to push OS settings, security updates, and packages.
*   **DevSecOps Best Practice:** Protecting system secrets (licenses, access credentials) using advanced AES-256 encryption.
*   **System Architecture Design:** Bridging physical and virtual network interfaces to allow guests to act as first-class citizens on the LAN.

---

## 2. Infrastructure Architecture

This lab runs on a dedicated physical **BOSGAME P3 Lite Mini PC** acting as out bare-metal hypervisor, controlled remotely from a development laptop.

```mermaid
graph TD
    Laptop[Laptop: Nobara Linux] -- SSH/IaC Control --o Hypervisor[Hypervisor Host: RHEL 10]

    subgraph host ["Hypervisor Host (172.30.1.10)"]
        Bridge[Physical Bridge: br0]
        KVM[KVM / QEMU Hypervisor]
        VM1[ansible-control<br>172.30.1.200]
        VM2[web-portfolio<br>172.30.1.201]
        VM3[media-stream<br>172.30.1.202]

        Bridge --- VM1
        Bridge --- VM2
        Bridge --- VM3
    end

    subgraph workspace ["Dev Workspace (Development)"]
        DevContainer[VS Code Dev Container<br>registry.redhat.io/ansible-automation-platform-25/ansible-dev-tools-rhel8:latest]
        DevContainer -- Ansible Navigator --o VM1
        DevContainer -- Ansible Navigator --o VM2
        DevContainer -- Ansible Navigator --o VM3
    end
```

---

## 3. Project Documentation

To make this project easily readable, the documentation has been divided into detailed technical chapters. Click any link below to dive into specific design decisions and troubleshooting logs:

[Hypervisor Setup](docs/01_hypervisor_setup.md)

[Terraform Provisioning](docs/02_terraform_provisioning.md)
// Include links and their pages