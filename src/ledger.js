function Ledger (unit, handler) {
  this._unit = unit
  this._currentBalance = {
    bank: 0
  };
  this._pendingBalance = {
    bank: 0
  };
  this._committed = {}
  this._pendingMsg = {}
  this._handler = handler
  this.myNextId = {}
}

Ledger.prototype = {
  create: function (peerName, amount, condition, routeId) {
    if (!this.myNextId[peerName]) {
      this.myNextId[peerName] = 0;
    }
    if (condition) {
      return {
        msgType: 'COND',
        msgId: this.myNextId[peerName]++,
        amount,
        unit: this._unit,
        condition,
        routeId
      }
    } else {
      return {
        msgType: 'ADD',
        msgId: this.myNextId[peerName]++,
        amount,
        unit: this._unit
      }
    }
  },
  addBalance: function (party) {
    if (!this._balance[party]) {
      this._balance[party] = {
        current: 0,
        receivable: 0,
        payable: 0
      };
    }
  getBalance: function () {
    return this._balance.bank;
  },
  markAsPending: function (peerName, msg, outgoing) {
    console.log(`${this._myName} marks-As-Pending message ${(outgoing ? 'to' : 'from')} ${this._peerName}`, msg);
    const proposer = (outgoing ? 'bank' : peerName);
    const beneficiary = (outgoing ? peerName : 'bank');
    this.addBalance(proposer, 'payable', msg.amount);
    this.addBalance(beneficiary, 'receivable', msg.amount);
    this._pendingMsg[`${proposer}-${msg.msgId}`] = msg
    this._pendingMsg[`${proposer}-${msg.msgId}`].date = new Date().getTime();
  },
  resolvePending: function (peerName, orig, outgoing, commit) {
    console.log(`${this._myName} resolves-Pending message ${(outgoing ? 'to' : 'from')} ${this._peerName}`, msg, { commit });
    const proposer = (outgoing ? 'bank' : peerName);
    const beneficiary = (outgoing ? peerName : 'bank');
    this.addBalance(proposer, 'payable', -msg.amount);
    this.addBalance(beneficiary, 'receivable', -msg.amount);
    if (commit) {
      this.addBalance(proposer, 'current', -msg.amount);
      this.addBalance(beneficiary, 'current', msg.amount);

      this._committed[`${proposer}-${orig.msgId}`] = this._pendingMsg[`${proposer}-${orig.msgId}`]
      this._committed[`${proposer}-${orig.msgId}`].date = new Date().getTime();
    }
    delete this._pendingMsg[`${proposer}-${msg.msgId}`];
  }
}

module.exports = Ledger
