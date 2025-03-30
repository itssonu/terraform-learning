variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "project_name" {
  description = "Environment"
  type        = string
}

variable "domain_name" {
  description = "Environment"
  type        = string
}

variable "sendgrid_api_key" {
  description = "Environment"
  type        = string
  sensitive = true
}

variable "sendgrid_email_sender" {
  description = "Environment"
  type        = string
}

variable "anthropic_api_key" {
  description = "Environment"
  type        = string
  sensitive = true
}