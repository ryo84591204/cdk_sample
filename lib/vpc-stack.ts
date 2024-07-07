import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
// import { ResourceName } from "./utils/resource-name";
import { SubnetConstruct } from "./constructs/subnet";

interface VpcStackProps extends cdk.StackProps {
  projectName: string;
  targetEnv: string;
}

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { projectName, targetEnv } = props;
    // const resourceName = new ResourceName(projectName, targetEnv);

    // VPCの作成
    const vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: `${projectName}-${targetEnv}`,
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
    });

    // サブネットの作成
    new SubnetConstruct(this, "Subnet", {
      vpc,
      projectName,
      targetEnv,
    });

    // S3エンドポイントの作成
    const s3Endpoint = vpc.addGatewayEndpoint("S3Endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });
    cdk.Tags.of(s3Endpoint).add("Name", `${projectName}-${targetEnv}`);
  }
}
