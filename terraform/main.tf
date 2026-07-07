terraform {
  required_version = ">= 1.0"
  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "0.7.6"
    }
  }
}

provider "libvirt" {
  uri = "qemu+ssh://sho@hypervisor.lab.local/system"
}

locals {
  ssh_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJHwJzj/dCMOC+zJviqO32+/22kABZBdwC+NvyM+7+Vz sho@nobara"

  vms = {
    "freeipa" = {
      vcpu   = 2
      memory = 4096
      ip     = "172.30.1.100"
    }
  }
}

resource "libvirt_volume" "vm_disk" {
  for_each         = local.vms
  name             = "${each.key}.qcow"
  pool             = "images"
  base_volume_name = "rhel-10-guest.qcow2"
  size             = 21474836480
  format           = "qcow2"
}

resource "libvirt_cloudinit_disk" "commoninit" {
  for_each = local.vms
  name     = "commoninit-${each.key}.raw"
  pool     = "images"
  user_data = templatefile("${path.module}/cloud_init.cfg", {
    hostname = each.key
    ssh_key  = local.ssh_key
  })
  network_config = templatefile("${path.module}/network_config.cfg", {
    ip_address = each.value.ip
  })
}

resource "libvirt_domain" "rhel_vm" {
  for_each = local.vms
  name     = each.key
  memory   = each.value.memory
  vcpu     = each.value.vcpu

  cpu {
    mode = "host-passthrough"
  }

  firmware = "/usr/share/edk2/ovmf/OVMF_CODE.fd"
  nvram {
    file     = "/var/lib/libvirt/qemu/nvram/${each.key}_VARS.fd"
    template = "/usr/share/edk2/ovmf/OVMF_VARS.fd"
  }

  qemu_agent = false

  disk {
    volume_id = libvirt_volume.vm_disk[each.key].id
  }

  disk {
    file = "/var/lib/libvirt/images/commoninit-${each.key}.raw"
    scsi = true
  }

  network_interface {
    bridge = "br0"
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  graphics {
    type        = "vnc"
    listen_type = "address"
    autoport    = true
  }
}
