resource "aws_docdb_cluster_parameter_group" "docdb" {
  family      = "docdb5.0"
  name        = "${local.name_prefix}-docdb"
  description = "docdb cluster parameter group"

  parameter {
    name  = "tls"
    value = "disabled"
  }
}

resource "aws_docdb_subnet_group" "docdb" {
  name       = "main"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_docdb_cluster" "docdb" {
  cluster_identifier      = "${local.name_prefix}-docdb"
  engine                  = "docdb"
  master_username         = "root"
  master_password         = "root_root"
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  db_subnet_group_name = aws_docdb_subnet_group.docdb.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.docdb.name
  vpc_security_group_ids = [aws_security_group.allow_in_vpc.id]
  storage_encrypted  = true
  depends_on = [ aws_docdb_cluster_parameter_group.docdb, aws_docdb_subnet_group.docdb, aws_security_group.allow_in_vpc ]
}

resource "aws_docdb_cluster_instance" "docdb" {
  count              = 1
  identifier         = "${local.name_prefix}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.docdb.cluster_identifier
  instance_class     = "db.t3.medium"

  depends_on = [ aws_docdb_cluster.docdb ]
}