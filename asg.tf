
resource "aws_launch_template" "asg_launch_template" {
  name_prefix   = "asg-template"
  image_id      = "ami-0e2c8caa4b6378d8c" # Replace with your desired AMI ID
  instance_type = "t2.micro"              # Replace with your desired instance type

  key_name = "sonu-key-pair"

  network_interfaces {
    associate_public_ip_address = false
    security_groups            = [aws_security_group.internet.id, aws_security_group.ssh_vpc_only.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              sudo apt update
              sudo apt install -y apache2
              sudo systemctl start apache2
              echo "Hello from $(hostname)" > /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "sonu-asg-instance"
    }
  }
}

resource "aws_autoscaling_group" "asg" {
  name                = "sonu-asg"
  desired_capacity    = 2
  max_size           = 4
  min_size           = 1
  vpc_zone_identifier = module.vpc.private_subnets # Using private subnets from your VPC module
  health_check_type   = "EC2"
  health_check_grace_period = 300 # 300 seconds = 5 minutes

  target_group_arns = [aws_lb_target_group.app_tg.arn]

  launch_template {
    id      = aws_launch_template.asg_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "sonu-asg-instance"
    propagate_at_launch = true
  }
}