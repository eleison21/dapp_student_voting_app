App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Check if MetaMask's Ethereum provider is available
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
    } else if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Fallback to localhost if no provider is found
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    // Load the Election contract JSON file and instantiate it
    $.getJSON("build/contracts/Election.json", function(election) {
      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      return App.render();
    });
  },

  // Listen for votedEvent from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, { fromBlock: 0, toBlock: 'latest' }).watch(function(error, event) {
        console.log("Event triggered:", event);
        App.render();
      });
    });
  },

  // Render the UI by loading account data and candidate info from the contract
  render: function() {
    let electionInstance;
    const loader = $("#loader");
    const content = $("#content");

    loader.show();
    content.hide();

    // Load the user's account
    web3.eth.getCoinbase(function(err, account) {
      if (!err && account) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(count) {
      const candidatesResults = $("#candidatesResults");
      const candidatesSelect = $("#candidatesSelect");

      candidatesResults.empty();
      candidatesSelect.empty();

      // Loop from 1 to candidatesCount
      for (let i = 1; i <= count.toNumber(); i++) {
        electionInstance.candidates(i).then(function(candidate) {
          // candidate is [name, party, voteCount]
          const name = candidate[0];
          const party = candidate[1];
          const voteCount = candidate[2].toNumber();

          // Build a row with no ID column
          const candidateRow = `
            <tr>
              <td>${name}</td>
              <td>${party}</td>
              <td>${voteCount}</td>
            </tr>
          `;
          candidatesResults.append(candidateRow);

          // Add candidate option to the select dropdown
          const candidateOption = `<option value='${i}'>${name} (${party})</option>`;
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      if (hasVoted) {
        // If the user has voted, replace content with a thank you message.
        $("form").hide();
        $("#content").html("<h2 class='text-center'>Thank you for voting!</h2>");
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn("Render error:", error);
      loader.hide();
      content.show();
    });
  },

  // Cast a vote
  castVote: function() {
    const candidateNumber = $("#candidatesSelect").val();
    const voterName = $("#voterName").val().trim();

    if (!candidateNumber || voterName === "") {
      alert("Please select a candidate and enter your name.");
      return;
    }

    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateNumber, voterName, { from: App.account, gas: 3000000 });
    }).then(function(result) {
      // Replace content with a thank you message on success.
      $("#content").html("<h2 class='text-center'>Thank you for voting!</h2>");
    }).catch(function(err) {
      console.error("Vote error:", err);
      alert("Error casting vote. Check the console for details.");
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
