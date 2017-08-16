require('./sass/style.scss');
const $ = require("jquery");

$(function() {
  const apiRoot = "http://resttest.bench.co/transactions/";

  let allTransactions = [];

  function calculateBalance(transactions) {
    const finalBalance = transactions.reduce((balance, transaction) => {
    const amount = parseFloat(transaction.Amount)

    if(typeof amount === 'number') {
    return balance += amount;
    } else {
    return balance;
    }
    }, 0)

    return finalBalance;
  }

function showBalance(balance) {
  const balanceReadout = $('#balance-readout')

  if(balance >= 0) {
  balanceReadout.empty().append(`<span class="green">$ ${balance}</span>`);
  } else {
  balanceReadout.empty().append(`<span class="red">$ ${balance}</span>`);
  }
}

  function getRemainingPages(totalPages, pagePromises) {
    for(let i = 1; i < totalPages; i++ ) {
          const pagePromise = fetch(`${apiRoot}${i + 1}.json`)
          .then(response => {
            if (!response.ok) return Promise.reject()
            return response.json()
          })
        pagePromises.push(pagePromise)
      }
      return pagePromises;
  }

  function resolvePages(pagePromises, transactions) {
    Promise.all(pagePromises)
    .then( pages => {
      pages.forEach(page => {
        transactions = [...transactions, ...page.transactions];
      });
      return transactions;
    }).then(transactions => {
      allTransactions = [...transactions];
      showBalance(calculateBalance(allTransactions));
    });
  }

  function getTransactions() {
    fetch(`${apiRoot}1.json`)
    .then(response => {
      if (!response.ok) {
        return Promise.reject()
      }
      return response.json();
    })
    .then(json => {
      const page1 = json;
      const totalPages = (page1.totalCount.toString().slice(0, 1) * 1) + 1;

      let transactions = page1.transactions.map( data => data);
      let pagePromises = [];

      resolvePages(getRemainingPages(totalPages, pagePromises), transactions);

      return allTransactions;
    });
  }

  getTransactions();
});
