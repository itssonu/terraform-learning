# resource "null_resource" "delay_lambda" {
#   depends_on = [aws_cloudfront_distribution.www]
# }