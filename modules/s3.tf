resource "aws_s3_bucket" "wwww" {
  bucket = "www-${local.name_prefix}"
  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "wwww" {
  bucket = aws_s3_bucket.wwww.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "www" {
    bucket = aws_s3_bucket.wwww.id
  cors_rule {
    allowed_methods = [ "GET", "POST" ]
    allowed_origins = [ var.domain_name ]
  }
}

resource "aws_s3_bucket_website_configuration" "www" {
  bucket = aws_s3_bucket.wwww.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# data "aws_iam_policy_document" "www" {
#     statement {
#       actions = [ "s3:GetObject" ]
#       resources = [ "${aws_s3_bucket.wwww.arn}/*" ]
#       principals {
#         type = "Service"
#         identifiers = ["cloudfront.amazonaws.com"]
#       }
#       condition {
#           test     = "StringEquals"
#       variable = "AWS:SourceArn"
#       values   = [aws_cloudfront_distribution.website.arn]
#     }
#       }
#     }
# }

