#!/usr/bin/env bash
set -euo pipefail

PROFILE=${PROFILE:-hugobo-theodo}
REGION=eu-west-3
NAME=vulgatech-metabase
# The instance terminates itself after the session so it never runs up costs.
SHUTDOWN_UTC=${SHUTDOWN_UTC:-17:00}

aws_() { aws --profile "$PROFILE" --region "$REGION" "$@"; }

AMI=$(aws_ ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query Parameter.Value --output text)
VPC=$(aws_ ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)

SG=$(aws_ ec2 describe-security-groups --filters Name=group-name,Values=$NAME Name=vpc-id,Values=$VPC --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = "None" ]; then
  SG=$(aws_ ec2 create-security-group --group-name $NAME --description "Metabase Vulgatech" --vpc-id "$VPC" --query GroupId --output text)
  aws_ ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null
fi

USER_DATA=$(cat <<EOF
#!/bin/bash
shutdown -h $SHUTDOWN_UTC
dnf install -y docker
systemctl enable --now docker
docker run -d --restart unless-stopped -p 80:3000 --name metabase metabase/metabase:latest
EOF
)

ID=$(aws_ ec2 run-instances --image-id "$AMI" --instance-type t3.small \
  --security-group-ids "$SG" --associate-public-ip-address \
  --instance-initiated-shutdown-behavior terminate \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME}]" \
  --user-data "$USER_DATA" --query 'Instances[0].InstanceId' --output text)
aws_ ec2 wait instance-running --instance-ids "$ID"
DNS=$(aws_ ec2 describe-instances --instance-ids "$ID" --query 'Reservations[0].Instances[0].PublicDnsName' --output text)
echo "$ID http://$DNS"

# The deck links point to this CloudFront URL: re-pointing it keeps them valid over HTTPS.
DISTRIBUTION=EQQY1TB1OOV3P
CONFIG=$(mktemp)
ETAG=$(aws --profile "$PROFILE" cloudfront get-distribution-config --id $DISTRIBUTION --query ETag --output text)
aws --profile "$PROFILE" cloudfront get-distribution-config --id $DISTRIBUTION --query DistributionConfig --output json \
  | python3 -c "import json,sys; d=json.load(sys.stdin); d['Enabled']=True; d['Origins']['Items'][0]['DomainName']='$DNS'; print(json.dumps(d))" > "$CONFIG"
aws --profile "$PROFILE" cloudfront update-distribution --id $DISTRIBUTION --if-match "$ETAG" --distribution-config "file://$CONFIG" >/dev/null
echo "https://d3ntob2958279t.cloudfront.net (actif d'ici ~15 min)"
