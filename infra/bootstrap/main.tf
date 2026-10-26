terraform {
  required_version = ">= 1.10.0, < 2.0.0"
  required_providers {
    cloudflare = { source = "cloudflare/cloudflare", version = "= 5.27.0" }
  }
}

provider "cloudflare" {}
variable "account_id" { type = string }

# One-time state storage setup. The database and app use the remote state within it.
resource "cloudflare_r2_bucket" "terraform" {
  account_id    = var.account_id
  name          = "kian-academy-terraform"
  jurisdiction  = "default"
  storage_class = "Standard"
  lifecycle { prevent_destroy = true }
}

resource "cloudflare_r2_managed_domain" "terraform" {
  account_id  = var.account_id
  bucket_name = cloudflare_r2_bucket.terraform.name
  enabled     = false
}
