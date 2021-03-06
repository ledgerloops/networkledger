import { ChannelWatcher } from "./channelWatcher";
import { StateTransition } from "./SnapTransaction";

export type SnapMessageLogEntry = {
  stateTransition?: StateTransition;
  newTrustLevel?: number;
  time: Date;
  from: string;
  to: string;
  unit: string;
};

export type Balances = {
  current: number;
  payable: number;
  receivable: number;
};

export class SnapChecker {
  msgLog: SnapMessageLogEntry[];
  channelWatchers: {
    [agentName: string]: {
      [peerName: string]: {
        [unit: string]: ChannelWatcher;
      };
    };
  };

  constructor(locals: string[]) {
    this.msgLog = [];
    this.channelWatchers = {};
    locals.forEach(agentName => {
      this.channelWatchers[agentName] = {};
    });
  }

  private getChannelWatcher(
    agentName: string,
    peerName: string,
    unit: string,
    agentStart = 0,
    peerStart = 0
  ): ChannelWatcher {
    if (!this.channelWatchers[agentName]) {
      // this.channelWatchers[agentName] = {};
      throw new Error("Agent not local! " + agentName);
    }
    if (!this.channelWatchers[agentName][peerName]) {
      this.channelWatchers[agentName][peerName] = {};
    }
    if (!this.channelWatchers[agentName][peerName][unit]) {
      // console.log(
      //   "creating channel watcher",
      //   agentName,
      //   peerName,
      //   unit,
      //   agentStart,
      //   peerStart
      // );
      this.channelWatchers[agentName][peerName][unit] = new ChannelWatcher(
        agentStart,
        peerStart
      );
    }
    // console.log(
    //   "returning channel watcher",
    //   agentName,
    //   peerName,
    //   unit,
    //   agentStart,
    //   peerStart,
    //   this.channelWatchers[agentName][peerName][unit]
    // );
    return this.channelWatchers[agentName][peerName][unit];
  }

  private isLocal(agentName: string): boolean {
    return typeof this.channelWatchers[agentName] !== "undefined";
  }
  getBalances(agentName: string, peerName: string, unit: string): Balances {
    const channelWatcher = this.getChannelWatcher(agentName, peerName, unit);
    return {
      current: channelWatcher.getOurCurrent(),
      payable: channelWatcher.getOurPayable(),
      receivable: channelWatcher.getOurReceivable()
    };
  }
  setStartBalance(
    agentName: string,
    peerName: string,
    unit: string,
    agentStart: number,
    peerStart: number
  ): void {
    this.getChannelWatcher(agentName, peerName, unit, agentStart, peerStart);
  }
  private processTrustChange(msg: SnapMessageLogEntry): void {
    if (this.isLocal(msg.from)) {
      // console.log(
      //   "set our trust",
      //   msg.from,
      //   msg.to,
      //   msg.unit,
      //   msg.newTrustLevel
      // );
      this.getChannelWatcher(msg.from, msg.to, msg.unit).setOurTrust(
        msg.newTrustLevel as number
      );
    }
    if (this.isLocal(msg.to)) {
      // console.log(
      //   "set their trust",
      //   msg.to,
      //   msg.from,
      //   msg.unit,
      //   msg.newTrustLevel
      // );
      this.getChannelWatcher(msg.to, msg.from, msg.unit).setTheirTrust(
        msg.newTrustLevel as number
      );
    }
  }
  private processSnapMessage(msg: SnapMessageLogEntry): void {
    if (this.isLocal(msg.from)) {
      this.getChannelWatcher(msg.from, msg.to, msg.unit).handleMessageWeSend(
        msg.stateTransition as StateTransition,
        msg.time
      );
    }
    if (this.isLocal(msg.to)) {
      this.getChannelWatcher(msg.to, msg.from, msg.unit).handleMessageWeReceive(
        msg.stateTransition as StateTransition,
        msg.time
      );
    }
  }
  processMessage(msg: SnapMessageLogEntry): void {
    if (
      this.msgLog.length &&
      msg.time < this.msgLog[this.msgLog.length - 1].time
    ) {
      console.log("timing?", msg, this.msgLog);
      throw new Error("Please log messages in chronological order");
    }
    this.msgLog.push(msg);
    if (msg.stateTransition) {
      return this.processSnapMessage(msg);
    }
    if (msg.newTrustLevel) {
      return this.processTrustChange(msg);
    }
  }
}
