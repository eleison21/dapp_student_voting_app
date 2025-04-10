pragma solidity 0.4.20;

contract Election {
    address public admin;

    // Candidate struct without an ID field.
    struct Candidate {
        string name;
        string party;
        uint voteCount;
    }
    
    // Mapping from candidate number (index) to candidate details.
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    mapping(address => string) public voterNames;
    
    uint public candidatesCount;
    
    // Updated events with no candidate ID.
    event votedEvent(string candidateName, string voterName);
    event candidateAdded(string name, string party);
    
    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }
    
    // Constructor – sets the deployer as admin.
    // Note: No candidates are added by default.
    function Election() public {
        admin = msg.sender;
    }
    
    // Private function to add a candidate.
    function addCandidate(string _name, string _party) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(_name, _party, 0);
        candidateAdded(_name, _party);
    }
    
    // Public admin function to add a candidate.
    function adminAddCandidate(string _name, string _party) public onlyAdmin {
        addCandidate(_name, _party);
    }
    
    // Vote function now emits the candidate's name and the voter's name.
    // The candidate is selected via the mapping index (but the struct does not contain the ID)
    function vote(uint _candidateNumber, string _voterName) public {
        require(!voters[msg.sender]);
        require(_candidateNumber > 0 && _candidateNumber <= candidatesCount);
        
        voters[msg.sender] = true;
        voterNames[msg.sender] = _voterName;
        candidates[_candidateNumber].voteCount++;
        
        // Emit event without candidate ID.
        votedEvent(candidates[_candidateNumber].name, _voterName);
    }
}
