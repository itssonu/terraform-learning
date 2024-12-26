

resource "aws_instance" "bastion" {
  ami           = "ami-0e2c8caa4b6378d8c"  # Same AMI as your other instances
  instance_type = "t2.micro"
  
  subnet_id                   = module.vpc.public_subnets[0]  # Place in first public subnet
  vpc_security_group_ids      = [aws_security_group.ssh_anywhere.id]
  associate_public_ip_address = true
  key_name                   = "sonu-key-pair"  # Same key pair as your private instances

  tags = {
    Name = "sonu-bastion-host"
  }
}