data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "api" {
  name               = "${local.name_prefix}-api"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      aws_s3_bucket.generalBucket.arn,
      "${aws_s3_bucket.generalBucket.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "generalBucket" {
  name        = "${local.name_prefix}-api-s3-policy"
  description = "Allows Lambda API to access S3 general bucket"
  policy      = data.aws_iam_policy_document.s3_policy.json
}

resource "aws_iam_role_policy_attachment" "generalBucket" {
  role       = aws_iam_role.api.name
  policy_arn = aws_iam_policy.generalBucket.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "api" {
  function_name = "${local.name_prefix}-api"
  role          = aws_iam_role.api.arn
  image_uri     = "${aws_ecr_repository.api.repository_url}:latest"
  package_type  = "Image"
  timeout       = 30
  memory_size   = 1024
  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.allow_in_vpc.id]
  }
  environment {
    variables = {
      JWT_PRIVATEKEY = "JWT_TOKEN"
      JWT_EXPIRES_IN = "2d"
      BCRYPT_HASH    = 10
      DB_HOST_URL    = "mongodb://${aws_docdb_cluster.docdb.master_username}:${aws_docdb_cluster.docdb.master_password}@${aws_docdb_cluster.docdb.endpoint}:${aws_docdb_cluster.docdb.port}/?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
      OPENSSL_CONF          = "/dev/null"
      AWS_S3_BUCKET         = aws_s3_bucket.generalBucket.bucket
      SENDGRID_API_KEY      = var.sendgrid_api_key
      SENDGRID_EMAIL_SENDER = var.sendgrid_email_sender
      ANTHROPIC_API_KEY     = var.anthropic_api_key
    }
  }

  architectures = ["arm64"]

  depends_on = [
    aws_docdb_cluster.docdb, 
    aws_security_group.allow_in_vpc, 
    aws_iam_role.api, 
    aws_ecr_repository.api, 
    aws_cloudwatch_log_group.api, 
    aws_s3_bucket.generalBucket
  ]
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.name_prefix}-api"
  retention_in_days = 14
}
