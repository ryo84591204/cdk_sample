import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

interface SubnetConstructProps {
  vpc: ec2.IVpc;
  projectName: string;
  targetEnv: string;
}

export class SubnetConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SubnetConstructProps) {
    super(scope, id);

    const { vpc, projectName, targetEnv } = props;

    // パブリックサブネットの作成
    const publicSubnet1 = new ec2.Subnet(this, "PublicSubnet1", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}a`,
      cidrBlock: "10.0.1.0/24",
      mapPublicIpOnLaunch: true,
    });
    cdk.Tags.of(publicSubnet1).add(
      "Name",
      `${projectName}-${targetEnv}-public-subnet1`
    );

    const publicSubnet2 = new ec2.Subnet(this, "PublicSubnet2", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}b`,
      cidrBlock: "10.0.2.0/24",
      mapPublicIpOnLaunch: true,
    });
    cdk.Tags.of(publicSubnet2).add(
      "Name",
      `${projectName}-${targetEnv}-public-subnet2`
    );

    // プライベートサブネットの作成;
    const privateSubnet1 = new ec2.Subnet(this, "PrivateSubnet1", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}a`,
      cidrBlock: "10.0.3.0/24",
      mapPublicIpOnLaunch: false,
    });
    cdk.Tags.of(privateSubnet1).add(
      "Name",
      `${projectName}-${targetEnv}-private-subnet1`
    );

    const privateSubnet2 = new ec2.Subnet(this, "PrivateSubnet2", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}b`,
      cidrBlock: "10.0.4.0/24",
      mapPublicIpOnLaunch: false,
    });
    cdk.Tags.of(privateSubnet2).add(
      "Name",
      `${projectName}-${targetEnv}-private-subnet2`
    );

    const lambdaPrivateSubnet1 = new ec2.Subnet(this, "LambdaPrivateSubnet1", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}a`,
      cidrBlock: "10.0.5.0/24",
      mapPublicIpOnLaunch: false,
    });
    cdk.Tags.of(lambdaPrivateSubnet1).add(
      "Name",
      `${projectName}-${targetEnv}-lambda-private-subnet1`
    );

    const lambdaPrivateSubnet2 = new ec2.Subnet(this, "LambdaPrivateSubnet2", {
      vpcId: vpc.vpcId,
      availabilityZone: `${cdk.Stack.of(this).region}b`,
      cidrBlock: "10.0.6.0/24",
      mapPublicIpOnLaunch: false,
    });
    cdk.Tags.of(lambdaPrivateSubnet2).add(
      "Name",
      `${projectName}-${targetEnv}-lambda-private-subnet2`
    );

    // NATゲートウェイの作成
    const natEip = new ec2.CfnEIP(this, "NatEIP", {
      tags: [{ key: "Name", value: `${projectName}-${targetEnv}-nat-eip` }],
    });

    const natGateway = new ec2.CfnNatGateway(this, "NatGateway", {
      subnetId: publicSubnet1.subnetId,
      allocationId: natEip.attrAllocationId,
      tags: [{ key: "Name", value: `${projectName}-${targetEnv}-nat-gateway` }],
    });

    // セキュリティグループの作成
    const sg = new ec2.SecurityGroup(this, "EndpointSG", {
      vpc,
      allowAllOutbound: true,
      securityGroupName: `${projectName}-${targetEnv}-secretsmanager`,
    });

    // 必要に応じてインバウンドルールを追加
    sg.addIngressRule(
      ec2.Peer.ipv4("10.0.0.0/16"),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic from VPC"
    );

    // Secrets Managerエンドポイントの作成
    const secretsManagerEndpoint = new ec2.CfnVPCEndpoint(
      this,
      "SecretsManagerEndpoint",
      {
        vpcId: vpc.vpcId,
        serviceName: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER.name,
        subnetIds: [
          lambdaPrivateSubnet1.subnetId,
          lambdaPrivateSubnet2.subnetId,
        ],
        securityGroupIds: [sg.securityGroupId],
        vpcEndpointType: "Interface",
      }
    );
    cdk.Tags.of(secretsManagerEndpoint).add(
      "Name",
      `${projectName}-${targetEnv}-secretsmanager`
    );
  }
}
