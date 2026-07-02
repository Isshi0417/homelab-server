# IaC Provisioning with Terraform & UEFI

[← Back to Main README](../README.md)

This section explains the Infrastructure as Code (IaC) deployment decisions, hypervisor CPU settings, and the workarounds required required to boot UEFI virtual machines running RHEL 10.

---

## 1. Microarchitecture Requirements: x86-64-v3

When I first booted RHEL 10 virtual machines, they crashed immediately and locked the host CPU cores at 100% capacity.

### The Diagnostics:

*   Red Hat Enterprise Linux 10 mandates the x86-64-v3 CPU microarchitecture level.
*   By default, QEMU and the Terraform libvirt provider emulate a generic qemu64 CPU, which only supports x86-64-v1 (a baseline from 2004).
*   Because qemu64 lacks the AVX, AVX2, BMI1, and FMA3 instruction sets required by RHEL 10, the guest kernel crashes immediately upon boot.

### The Solution:

I updated the CPU configuration block in main.tf to pass the host CPU instruction directly to the VM:

```
cpu {
    mode = "host-passthrough"
}
```

*   host-passthrough tells KVM to expose the physical AMD Ryzen processor capabilities directly to the VM kernel. This satisfies the x86-64-v3 microarchitecture check and enables high-performance virtualization.

---

## 2. UEFI Firmware Mapping (EDK2 / OVMF)

Traditional virtual machines use a legacy BIOS loader. However, modern RHEL 10 guests are designed to boot using **UEFI (Unified Extensible Firmware Interface)**.

To enable UEFI in my KVM VMs, I configured the domain firmware blocks:

```
nvram {
    file        = "/var/lib/libvirt/qemu/nvram/${each.key}_VARS.fd"
    template    = "/usr/share/edk2/ovmf/OVMF_VARS.fd"
}
```

*   OVMF_CODE.fd: The read-only UEFI BIOS code file provided by the host's edk2-ovmf package.
*   OVMF_VARS.fd: The template containing default NVRAM variables (boot order, secure boot state).
*   nvram {}: Creates a private, writable copy of the NVRAM variables file for each virtual machine (e.g., ansible-control_VARS.fd), ensuring their boot states do not interfere with each other.

---

## 3. SCSI Bus Cloud-Init Workaround

This was the most complex technical hurdle of the VM deployment.

### The Problem:

RHEL 10 has completely deprecated and removed legacy IDE controller drivers from its kernel. The standard Terraform libvirt_cloudinit_disk resource creates a .iso file and automatically mounts it as an ide-cdrom volume. Since the RHEL 10 kernel cannot load IDE drivers, the VM boots but fails to see the cloud-init volume, skipping all user setup and network configurations.

### The Solution:

I bypassed the automatic attachment and configured a custom block:

1. I created the cloud-init resource as a raw disk (.raw extension instead of .iso to bypass provider type validation).
2. I attached it explicitly to the domain as a SCSI disk:

```
disk {
    volume_id   = libvirt_cloudinit_disk.commoninit[each.key].id
    scsi        = true
}
```

*   scsi = true: Forces QEMU to attach the configuration disk using the modern virtio-scsi driver. The RHEL 10 guest kernel loads this driver immediately, successfully mounts the drive at /dev/sda, and parses the configuration metadata on first boot.
