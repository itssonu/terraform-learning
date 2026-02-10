# Security Group for the Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Security Group for PFQ Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "pfq_tasks" {
  name        = "${local.name_prefix}-pfq-tasks"
  description = "Security Group for PFQ ECS Tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "pfq_task_execution_role" {
  name = "${local.name_prefix}-pfq-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.pfq_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "pfq_task_role" {
  name = "${local.name_prefix}-pfq-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Add any specific permissions your app needs here
resource "aws_iam_role_policy" "pfq_task_role_policy" {
  name = "${local.name_prefix}-pfq-task-policy"
  role = aws_iam_role.pfq_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# ALB
resource "aws_lb" "pfq_alb" {
  name               = "${local.name_prefix}-pfq-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false
}

# ALB Target Group
resource "aws_lb_target_group" "pfq_tg" {
  name        = "${local.name_prefix}-pfq-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
  }
}

# ALB Listener
# resource "aws_lb_listener" "pfq_https" {
#   load_balancer_arn = aws_lb.pfq_alb.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-2016-08"

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.pfq_tg.arn
#   }
# }

# resource "aws_lb_listener" "pfq_http" {
#   load_balancer_arn = aws_lb.pfq_alb.arn
#   port              = 80
#   protocol          = "HTTP"

#    default_action {
#     type = "redirect"

#     redirect {
#       protocol    = "HTTPS"
#       port        = "443"
#       status_code = "HTTP_301"
#     }
#   }
# }

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "pfq_logs" {
  name              = "/ecs/${local.name_prefix}-pfq-app"
  retention_in_days = 30
}

# ECS Cluster
resource "aws_ecs_cluster" "pfq_cluster" {
  name = "${local.name_prefix}-pfq-cluster"

#   setting {
#     name  = "containerInsights"
#     value = "enabled"
#   }

  tags = local.common_tags
}

# ECS Task Definition
resource "aws_ecs_task_definition" "pfq_task" {
  family                   = "${local.name_prefix}-pfq-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"  # 0.5 vCPU
  memory                   = "1024" # 1 GB
  execution_role_arn       = aws_iam_role.pfq_task_execution_role.arn
  task_role_arn            = aws_iam_role.pfq_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "pfq-app"
      image     = "${aws_ecr_repository.pfq.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.pfq_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }



      environment = [
        # Add environment variables needed by your application
        {
          name  = "NODE_ENV"
          value = var.env
        },
        {
          name  = "JWT_PRIVATEKEY"
          value = "JWT_TOKEN"
        },
        {
          name  = "BASE_URL"
          value = aws_cloudfront_distribution.www.domain_name
        },
        {
          name  = "DB_HOST_URL"
          value = "mongodb://${aws_docdb_cluster.docdb.master_username}:${aws_docdb_cluster.docdb.master_password}@${aws_docdb_cluster.docdb.endpoint}:${aws_docdb_cluster.docdb.port}/?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
        },
        {
          name  = "OPENSSL_CONF"
          value = "/dev/null"
        },
        {
          name  = "AWS_S3_BUCKET"
          value = aws_s3_bucket.generalBucket.bucket
        },
        {
          name  = "SENDGRID_API_KEY"
          value = var.sendgrid_api_key
        },
        {
          name  = "sendgrid_email_sender"
          value = var.sendgrid_email_sender
        },
        {
          name  = "ANTHROPIC_API_KEY"
          value = var.anthropic_api_key
        }

      ]
    }
  ])

  depends_on = [
    aws_cloudfront_distribution.www,
    aws_s3_bucket.generalBucket, aws_docdb_cluster.docdb,
    aws_cloudwatch_log_group.pfq_logs,
    aws_iam_role.pfq_task_execution_role,
    aws_iam_role.pfq_task_role
  ]
}

# ECS Service
# resource "aws_ecs_service" "pfq_service" {
#   name                              = "${local.name_prefix}-pfq-service"
#   cluster                           = aws_ecs_cluster.pfq_cluster.id
#   task_definition                   = aws_ecs_task_definition.pfq_task.arn
#   desired_count                     = 1
#   launch_type                       = "FARGATE"
#   health_check_grace_period_seconds = 300

#   network_configuration {
#     subnets          = module.vpc.private_subnets
#     security_groups  = [aws_security_group.pfq_tasks.id]
#     assign_public_ip = false
#   }

#   load_balancer {
#     target_group_arn = aws_lb_target_group.pfq_tg.arn
#     container_name   = "pfq-app"
#     container_port   = 5000
#   }

#   deployment_controller {
#     type = "ECS"
#   }

#   # Ignore task_definition changes as we update it externally
#   lifecycle {
#     ignore_changes = [task_definition]
#   }

#   depends_on = [aws_lb_listener.pfq_http]
# }

# Auto Scaling Target
# resource "aws_appautoscaling_target" "pfq_service_scaling" {
#   max_capacity       = 10
#   min_capacity       = 1
#   resource_id        = "service/${aws_ecs_cluster.pfq_cluster.name}/${aws_ecs_service.pfq_service.name}"
#   scalable_dimension = "ecs:service:DesiredCount"
#   service_namespace  = "ecs"
# }

# # Auto Scaling Policy - CPU
# resource "aws_appautoscaling_policy" "pfq_service_cpu_scaling" {
#   name               = "${local.name_prefix}-pfq-cpu-scaling"
#   policy_type        = "TargetTrackingScaling"
#   resource_id        = aws_appautoscaling_target.pfq_service_scaling.resource_id
#   scalable_dimension = aws_appautoscaling_target.pfq_service_scaling.scalable_dimension
#   service_namespace  = aws_appautoscaling_target.pfq_service_scaling.service_namespace

#   target_tracking_scaling_policy_configuration {
#     predefined_metric_specification {
#       predefined_metric_type = "ECSServiceAverageCPUUtilization"
#     }
#     target_value       = 70.0  # Target CPU utilization (70%)
#     scale_in_cooldown  = 300   # 5 minutes
#     scale_out_cooldown = 60    # 1 minute
#   }
# }

# # Auto Scaling Policy - Memory
# resource "aws_appautoscaling_policy" "pfq_service_memory_scaling" {
#   name               = "${local.name_prefix}-pfq-memory-scaling"
#   policy_type        = "TargetTrackingScaling"
#   resource_id        = aws_appautoscaling_target.pfq_service_scaling.resource_id
#   scalable_dimension = aws_appautoscaling_target.pfq_service_scaling.scalable_dimension
#   service_namespace  = aws_appautoscaling_target.pfq_service_scaling.service_namespace

#   target_tracking_scaling_policy_configuration {
#     predefined_metric_specification {
#       predefined_metric_type = "ECSServiceAverageMemoryUtilization"
#     }
#     target_value       = 70.0  # Target Memory utilization (70%)
#     scale_in_cooldown  = 300   # 5 minutes
#     scale_out_cooldown = 60    # 1 minute
#   }
# }