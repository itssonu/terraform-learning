resource "aws_cloudfront_origin_access_control" "www" {
  name                              = "${local.name_prefix}-oac"
  description                       = "oac for www bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "www" {
  price_class = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.wwww.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.www.id
    origin_id                = "${aws_s3_bucket.wwww.id}-origin_id"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "disturbution for s3 buckt www"
  default_root_object = "index.html"
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${aws_s3_bucket.wwww.id}-origin_id"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

   restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["IN"]
    }
  }

}