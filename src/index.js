require('./sass/style.scss');
const $ = require("jquery");

$(function() {
  const apiRoot = "http://resttest.bench.co/transactions/";

  let allTransactions = [];

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
      console.log(allTransactions);
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
