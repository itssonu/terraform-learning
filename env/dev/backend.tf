terraform {
  backend "s3" {
    bucket = "project-sonu"
    key    = "tf_state/dev/terraform.tfstate"
    region = "us-west-1"
  }
}