# resource "aws_api_gateway_rest_api" "api" {
#   name        = "${local.name_prefix}-api"
#   description = "Terraform Serverless Application Example test"
# }

# resource "aws_api_gateway_resource" "proxy" {
#   rest_api_id = "${aws_api_gateway_rest_api.api.id}"
#   parent_id   = "${aws_api_gateway_rest_api.api.root_resource_id}"
#   path_part   = "{proxy+}"
# }

# resource "aws_api_gateway_method" "proxy" {
#   rest_api_id   = "${aws_api_gateway_rest_api.api.id}"
#   resource_id   = "${aws_api_gateway_resource.proxy.id}"
#   http_method   = "ANY"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_integration" "api" {
#   rest_api_id = "${aws_api_gateway_rest_api.api.id}"
#   resource_id = "${aws_api_gateway_method.proxy.resource_id}"
#   http_method = "${aws_api_gateway_method.proxy.http_method}"

#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = "${aws_lambda_function.api.invoke_arn}"
# }

# resource "aws_api_gateway_method" "proxy_root" {
#   rest_api_id   = "${aws_api_gateway_rest_api.api.id}"
#   resource_id   = "${aws_api_gateway_rest_api.api.root_resource_id}"
#   http_method   = "ANY"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_integration" "api_root" {
#   rest_api_id = "${aws_api_gateway_rest_api.api.id}"
#   resource_id = "${aws_api_gateway_method.proxy_root.resource_id}"
#   http_method = "${aws_api_gateway_method.proxy_root.http_method}"

#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = "${aws_lambda_function.api.invoke_arn}"
# }

# resource "aws_api_gateway_stage" "api" {
#   stage_name    = var.env
#   rest_api_id   = aws_api_gateway_rest_api.api.id
#   deployment_id = aws_api_gateway_deployment.api.id

#   description   = "${var.env} stage for API Gateway"

#   access_log_settings {
#     destination_arn = aws_cloudwatch_log_group.api.arn
#     format = jsonencode({
#       requestId       = "$context.requestId"
#       ip             = "$context.identity.sourceIp"
#       requestTime    = "$context.requestTime"
#       httpMethod     = "$context.httpMethod"
#       resourcePath   = "$context.resourcePath"
#       status         = "$context.status"
#       protocol       = "$context.protocol"
#       responseLength = "$context.responseLength"
#     })
#   }

#   depends_on = [aws_cloudwatch_log_group.api]
# }

# resource "aws_api_gateway_deployment" "api" {
#   depends_on = [
#     aws_api_gateway_integration.api,
#     aws_api_gateway_integration.api_root,
#   ]

#   rest_api_id = "${aws_api_gateway_rest_api.api.id}"
# }

# # log

# data "aws_iam_policy_document" "api_gateway_assume_role" {
#   statement {
#     effect = "Allow"
#     principals {
#       type        = "Service"
#       identifiers = ["apigateway.amazonaws.com"]
#     }
#     actions = ["sts:AssumeRole"]
#   }
# }
# resource "aws_iam_role" "api_gateway_logging_role" {
#   name = "${var.env}-api-gateway-logging-role"
#   assume_role_policy = data.aws_iam_policy_document.api_gateway_assume_role.json
# }

# # Define IAM Policy for API Gateway to Write Logs
# data "aws_iam_policy_document" "api_gateway_logging_policy" {
#   statement {
#     effect = "Allow"
#     actions = [
#       "logs:CreateLogGroup",
#       "logs:CreateLogStream",
#       "logs:DescribeLogGroups",
#       "logs:DescribeLogStreams",
#       "logs:PutLogEvents",
#       "logs:GetLogEvents",
#       "logs:FilterLogEvents"
#     ]
#     resources = ["*"]
#   }
# }

# # Attach Policy to IAM Role
# resource "aws_iam_role_policy" "api_gateway_logging_policy" {
#   name   = "${var.env}-api-gateway-logging-policy"
#   role   = aws_iam_role.api_gateway_logging_role.id
#   policy = data.aws_iam_policy_document.api_gateway_logging_policy.json
# }

# resource "aws_cloudwatch_log_group" "api" {
#   name = "/aws/api-gateway/${aws_api_gateway_rest_api.api.name}"
#   retention_in_days = 7
# }

# resource "aws_apigatewayv2_api" "lambda_api" {
#   name          = "express-app-api"
#   protocol_type = "HTTP"
# }

# resource "aws_apigatewayv2_stage" "lambda_stage" {
#   api_id      = aws_apigatewayv2_api.lambda_api.id
#   name        = "$default"
#   auto_deploy = true
# }

# resource "aws_apigatewayv2_integration" "lambda_integration" {
#   api_id             = aws_apigatewayv2_api.lambda_api.id
#   integration_type   = "AWS_PROXY"
#   integration_uri    = aws_lambda_function.api.invoke_arn
#   integration_method = "POST"
#   payload_format_version = "2.0"
#   depends_on = [ aws_lambda_function.api, aws_apigatewayv2_api.lambda_api ]
# }

# resource "aws_apigatewayv2_route" "lambda_route" {
#   api_id    = aws_apigatewayv2_api.lambda_api.id
#   route_key = "ANY /{proxy+}"
#   target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
# }

# resource "aws_lambda_permission" "api_gw" {
#   statement_id  = "AllowExecutionFromAPIGateway"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.api.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${aws_apigatewayv2_api.lambda_api.execution_arn}/*/*/{proxy+}"
# }