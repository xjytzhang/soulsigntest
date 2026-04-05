async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 部署 SoulSign 合约
  const SoulSign = await ethers.getContractFactory("SoulSign");
  const soulSign = await SoulSign.deploy();

  await soulSign.waitForDeployment();
  const contractAddress = await soulSign.getAddress();

  console.log("SoulSign deployed to:", contractAddress);

  // 保存部署地址到文件，供前端使用
  const fs = require("fs");
  const deployments = {
    SoulSign: contractAddress,
    network: "baseSepolia",
    chainId: 84532
  };

  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deployments, null, 2)
  );
  console.log("Deployment info saved to deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
