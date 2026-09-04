output "ecr_repository_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "Container registry target for the Sentinel API image."
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "Reference ECS cluster name."
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.api.name
  description = "Log group used by the reference runtime."
}
