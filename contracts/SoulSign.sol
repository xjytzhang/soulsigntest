// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulSign is ERC721, ERC721URIStorage, Ownable {
    // 简单的计数器
    uint256 private _nextTokenId;

    // 紧急联系人结构
    struct EmergencyContact {
        string name;
        string email;
    }

    // 用户信息
    struct UserInfo {
        uint256 lastCheckIn;
        EmergencyContact emergencyContact;
        bool registered;
    }

    // 链上事件
    event SoulMinted(address indexed user, uint256 tokenId);
    event CheckedIn(address indexed user, uint256 timestamp);
    event EmergencyContactSet(address indexed user, string email, string name);

    // 用户地址 -> 用户信息
    mapping(address => UserInfo) public users;

    // tokenId -> 持有人
    mapping(uint256 => address) public tokenHolders;

    // 防止重复mint
    mapping(address => bool) public hasMinted;

    // 每个NFT的费用（设为0即为免费）
    uint256 public mintFee = 0;

    constructor() ERC721("SoulSign", "SOUL") {
        _nextTokenId = 1;
    }

    // 覆盖 _burn，解决 ERC721 和 ERC721URIStorage 的冲突
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // 设置mint费用
    function setMintFee(uint256 _fee) external onlyOwner {
        mintFee = _fee;
    }

    // Mint Soul NFT
    function mintSoulNFT(string calldata tokenURI_) external payable {
        require(!hasMinted[msg.sender], "Already minted");
        require(msg.value >= mintFee, "Insufficient mint fee");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        hasMinted[msg.sender] = true;

        // 初始化用户信息
        users[msg.sender] = UserInfo({
            lastCheckIn: block.timestamp,
            emergencyContact: EmergencyContact({name: "", email: ""}),
            registered: true
        });

        tokenHolders[tokenId] = msg.sender;

        emit SoulMinted(msg.sender, tokenId);
    }

    // 每日签到
    function checkIn() external {
        require(hasMinted[msg.sender], "Please mint your Soul NFT first");
        users[msg.sender].lastCheckIn = block.timestamp;
        emit CheckedIn(msg.sender, block.timestamp);
    }

    // 设置紧急联系人
    function setEmergencyContact(string calldata _name, string calldata _email) external {
        require(hasMinted[msg.sender], "Please mint your Soul NFT first");
        require(bytes(_email).length > 0, "Email cannot be empty");

        users[msg.sender].emergencyContact = EmergencyContact({
            name: _name,
            email: _email
        });

        emit EmergencyContactSet(msg.sender, _email, _name);
    }

    // 查询最后签到时间
    function getLastCheckIn(address _user) external view returns (uint256) {
        return users[_user].lastCheckIn;
    }

    // 查询是否已mint
    function hasSoulNFT(address _user) external view returns (bool) {
        return hasMinted[_user];
    }

    // 获取紧急联系人
    function getEmergencyContact(address _user) external view returns (string memory, string memory) {
        return (users[_user].emergencyContact.name, users[_user].emergencyContact.email);
    }

    // 查询用户是否注册
    function isRegistered(address _user) external view returns (bool) {
        return users[_user].registered;
    }

    // 获取用户总数
    function getTotalSouls() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // 提现合约余额（仅owner）
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // 禁止NFT转移（不可转让）
    function transferFrom(address, address, uint256) public pure override(ERC721, IERC721) {
        revert("Soul NFT is non-transferable");
    }

    function safeTransferFrom(address, address, uint256) public pure override(ERC721, IERC721) {
        revert("Soul NFT is non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721, IERC721) {
        revert("Soul NFT is non-transferable");
    }

    // 以下是 ERC721URIStorage 必需函数
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
