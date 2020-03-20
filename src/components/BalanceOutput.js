import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    // console.log(this.props);
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];
  //Dynamic condition for filtering journal entries
  const condition = (f,s,e)=>{
    return s & e?   f>=s && f<=e:
    s? f>=s:f<=e;
  };

  balance= state.journalEntries
  .filter(f=> //filter dynamically by account and date range
    (condition(f.ACCOUNT,state.userInput.startAccount,state.userInput.endAccount)) && 
    (condition(f.PERIOD.getTime(),state.userInput.startPeriod? state.userInput.startPeriod.getTime():null,state.userInput.endPeriod? state.userInput.endPeriod.getTime():null))
    )
  .map(row=> {
    //Search account
    const account = state.accounts.filter(f=> f.ACCOUNT===row.ACCOUNT);
    return {
      ACCOUNT : row.ACCOUNT,
      DESCRIPTION: account.length>0? account[0].LABEL:'',//Asigns description if an account is found
      DEBIT : row.DEBIT,
      CREDIT : row.CREDIT,
      BALANCE : row.DEBIT-row.CREDIT// Gets difference between debit and credit
    };
  }).sort((a,b)=> a.ACCOUNT>b.ACCOUNT);//incrementing sorting
    /*
    NOTE: There is a journal entry that does not contains a valid account, I am not sure 
    if this is ok or no, so I set not found accounts inside the list without description
    thinking that it is worse ignore money just because a description that could qualify as "others"
    */
  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);
  
  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
