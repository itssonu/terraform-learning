resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"  # Public access. Use "AWS_IAM" for authenticated access

  cors {
    allow_credentials = true
    allow_origins     = ["*"]  # Consider restricting this in production
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowFunctionURLInvoke"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.api.function_name
  principal     = "*"
  
  function_url_auth_type = "NONE"
}