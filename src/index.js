require('./sass/style.scss');
const $ = require('jquery');
const moment = require('moment');

$(function() {
  const apiRoot = 'http://resttest.bench.co/transactions/';

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
      balanceReadout.empty().append(`<span class="green">$${balance}</span>`);
    } else {
      balanceReadout.empty().append(`<span class="red">$${balance}</span>`);
    }
  }

  function formatLedgerData(ledgerData) {
    if(!ledgerData) return 'N/A';
    return ledgerData.split(',').join('<span class="arrow">&#9657</span>');
  }

  function formatDate(date) {
    if(!date) return 'N/A';
    return moment(date).format('MMM Do, YYYY');
  }

  function showTransactions(transactions) {
    const loadingIndicator = $('.loading-indicator');
    const transactionsTable = $('.account-info');

    for(let i = 0; i < transactions.length; i++ ) {
      const formattedDate = formatDate(transactions[i].Date);
      const formattedLedger = formatLedgerData(transactions[i].Ledger);

      if(i % 2 === 0 && transactions[i]) {
        let transactionElement = `<div class="table-row green">
                                    <p class="date">${formattedDate}</p>
                                    <p class="company">${transactions[i].Company}</p>
                                    <p class="account">${formattedLedger}</p>
                                    <p class="balance">$${transactions[i].Amount}</p>
                                  </div>`
        transactionsTable.append(transactionElement)
      } else {
        let transactionElement = `<div class="table-row">
                                    <p class="date">${formattedDate}</p>
                                    <p class="company">${transactions[i].Company}</p>
                                    <p class="account">${formattedLedger}</p>
                                    <p class="balance">$${transactions[i].Amount}</p>
                                  </div>`
        transactionsTable.append(transactionElement)
      }
    }
    loadingIndicator.hide();
    transactionsTable.show()
  }

  function getRemainingPages(totalPages, pagePromises) {
    for(let i = 1; i < totalPages; i++ ) {
      const pagePromise = fetch(`${apiRoot}${i + 1}.json`)
                          .then(response => {
                            if (!response.ok) return Promise.reject()
                            return response.json()
                          });
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
    })
    .then(transactions => {
      showBalance(calculateBalance(transactions));
      showTransactions(transactions);
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
      let totalPages;

      // Since each page contains a maximum of 10 entries,
      // the total number of available pages is calculated by looking at the total number of entries.
      // If there are ten or fewer entries, totalPages is set to 1.
      // If there are more than ten, the total number of entries is divided by ten, then rounded up
      // to find the total number of pages.

      if(page1.totalCount <= 10) {
        totalPages = 1;
      } else {
        totalPages = Math.ceil(page1.totalCount / 10);
      }

      let transactions = page1.transactions.map( data => data);
      let pagePromises = [];

      resolvePages(getRemainingPages(totalPages, pagePromises), transactions);

      return transactions;
    });
  }

  getTransactions();
});
