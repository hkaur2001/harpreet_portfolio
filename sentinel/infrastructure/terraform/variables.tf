variable "aws_region" {
  description = "AWS region for the reference Sentinel runtime."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Resource name prefix."
  type        = string
  default     = "sentinel"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "demo"
}
