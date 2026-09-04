terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ecr_repository" "api" {
  name                 = "${local.name}-api"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = local.common_tags
}

resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/sentinel/${var.environment}/api"
  retention_in_days = 30
  tags              = local.common_tags
}

# This module intentionally stops at the shared compute/observability primitives.
# A real organization should supply its own VPC, private subnets, ingress, IAM,
# RDS/pgvector, Redis, KMS, secrets, and deployment policy instead of a portfolio
# template pretending there is one universally safe production network topology.
