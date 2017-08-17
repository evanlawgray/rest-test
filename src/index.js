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

    if(!balance) {
      balanceReadout.empty().append('<span class="green">N/A</span>');
      return;
    }

    // If the user's account balance is negative, it is displayed in red,
    // if it is positive, it is displayed with the normal green colour.

    if(balance >= 0 ) {
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

    if(transactions.length === 0) {
      const placeholderElement = `<div class="table-row no-data">
                                    <p>No transactions to display</p>
                                  </div>`;
      transactionsTable.append(placeholderElement);
    }

    for(let i = 0; i < transactions.length; i++ ) {
      const formattedDate = formatDate(transactions[i].Date);
      const formattedLedger = formatLedgerData(transactions[i].Ledger);

      // Even numbered table rows use green colour for font, as per design specifications,
      // but are otherwise identical.

      if(i % 2 === 0 && transactions[i]) {
        const transactionElement = `<div class="table-row green">
                                    <p class="date">${formattedDate}</p>
                                    <p class="company">${transactions[i].Company}</p>
                                    <p class="account">${formattedLedger}</p>
                                    <p class="balance">$${transactions[i].Amount}</p>
                                  </div>`
        transactionsTable.append(transactionElement)
      } else {
        const transactionElement = `<div class="table-row">
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

  // The below function fetches data for the remaining pages after the first page of data has been fetched.
  // It returns an array of promises, which are then processed by the resolvePages function.

  function getRemainingPages(totalPages, pagePromises) {
    for(let i = 1; i < totalPages; i++ ) {
      const pagePromise = fetch(`${apiRoot}${i + 1}.json`)
                          .then(response => {
                            if (!response.ok) {
                              throw Error(response.statusText);
                            }
                            return response.json()
                          }).catch(error => console.log(error));
      pagePromises.push(pagePromise)
    }
    return pagePromises;
  }

  // The below function builds the complete list of all transactions,
  // then calls the showBalance and showTransactions functions that render transaction
  // data to the page.
  // If API calls for pages beyond page 1 fail, the first page of transaction data is still
  // returned and rendered to the page.

  function resolvePages(pagePromises, transactions) {
    Promise.all(pagePromises)
    .catch(error => {
      console.log(error);
    })
    .then( pages => {
      pages.forEach(page => {
        if(page) {
          transactions = [...transactions, ...page.transactions];
        } else {
          return;
        }
      });
      return transactions;
    })
    .then(transactions => {
      showBalance(calculateBalance(transactions));
      showTransactions(transactions);
      return transactions;
    });
  }

  // This function fetches data from the first API endpoint, then determines how many more API
  // calls will be needed to fetch the rest of the data. It represents the starting point of the
  // application's control flow.

  function getTransactions() {
    fetch(`${apiRoot}1.json`)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
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
    }).catch(error => console.log(error));
  }

  getTransactions();
});
