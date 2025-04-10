var Admin = {
    web3Provider: null,
    contracts: {},
    account: "0x0",
  
    init: function() {
      return Admin.initWeb3();
    },
  
    initWeb3: function() {
      // Check for modern dApp browsers (e.g. MetaMask)
      if (window.ethereum) {
        Admin.web3Provider = window.ethereum;
        window.ethereum.request({ method: "eth_requestAccounts" });
        web3 = new Web3(window.ethereum);
      } else if (typeof web3 !== "undefined") {
        Admin.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Fall back to Ganache if no provider is found.
        Admin.web3Provider = new Web3.providers.HttpProvider("http://localhost:7545");
        web3 = new Web3(Admin.web3Provider);
      }
      return Admin.initContract();
    },
  
    initContract: function() {
      // Load the Election contract JSON file and instantiate it
      $.getJSON("build/contracts/Election.json", function(election) {
        Admin.contracts.Election = TruffleContract(election);
        Admin.contracts.Election.setProvider(Admin.web3Provider);
  
        // Render the admin panel once the contract is loaded
        return Admin.render();
      });
    },
  
    render: function() {
      // Get the admin account from the injected web3 instance
      web3.eth.getCoinbase(function(error, account) {
        if (error) {
          console.error("Error fetching account:", error);
        } else {
          Admin.account = account;
          $("#adminAccountAddress").html("Your Account: " + account);
        }
      });
  
      // Render the candidate list in the admin panel
      Admin.contracts.Election.deployed().then(function(instance) {
        return instance.candidatesCount();
      }).then(function(count) {
        var candidateList = $("#candidateList");
        candidateList.empty();
  
        for (let i = 1; i <= count.toNumber(); i++) {
          Admin.contracts.Election.deployed().then(function(instance) {
            return instance.candidates(i);
          }).then(function(candidate) {
            // candidate = [name, party, voteCount]
            let name = candidate[0];
            let party = candidate[1];
            let voteCount = candidate[2].toNumber();
  
            // No ID column
            let candidateRow = `
              <tr>
                <td>${name}</td>
                <td>${party}</td>
                <td>${voteCount}</td>
              </tr>
            `;
            candidateList.append(candidateRow);
          }).catch(function(err) {
            console.error("Error reading candidate:", err);
          });
        }
      }).catch(function(error) {
        console.error("Error rendering candidates:", error);
      });
    },
  
    // Called when admin submits the form to add a candidate.
    addCandidate: function(event) {
      event.preventDefault();
      var candidateName = $("#newCandidateName").val().trim();
      var candidateParty = $("#newCandidateParty").val().trim();
  
      if (!candidateName || !candidateParty) {
        alert("Candidate name and party are required!");
        return;
      }
  
      Admin.contracts.Election.deployed().then(function(instance) {
        // The contract function is adminAddCandidate(string _name, string _party)
        return instance.adminAddCandidate(candidateName, candidateParty, { from: Admin.account, gas: 3000000 });
      }).then(function(result) {
        console.log("Candidate added successfully", result);
        // Reload the page so the new candidate appears in the list.
        location.reload();
      }).catch(function(err) {
        console.error("Error adding candidate:", err);
        alert("Error adding candidate. Check the console for details.");
      });
    }
  };
  
  $(function() {
    $(window).load(function() {
      Admin.init();
    });
  
    // Bind the form submit action to the addCandidate function.
    $("#addCandidateForm").on("submit", Admin.addCandidate);
  });
  