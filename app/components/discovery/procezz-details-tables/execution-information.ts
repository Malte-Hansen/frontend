import { action, computed, set } from '@ember/object';
import { htmlSafe } from '@ember/string';
import Component from '@glimmer/component';
import Procezz from 'explorviz-frontend/models/procezz';

interface IArgs {
  procezz: Procezz;
}

export default class ExecutionInformation extends Component<IArgs> {
  public tooltipTexts = {
    agentExecutionCommand: `If filled, this attribute shows the execution command that
      was internally used by the agent to restart this process.
      It is based on the User or OS Execution command.
      This attribute is only for your information.`,
    osExecutionCommand: `This attribute holds the Operating System execution
      command that was found by the agent for this process.`,
    stopped: 'Flag that indicates if the process is stopped.',
    userExecutionCommand: `The User Execution Command has a higher priority than the
      OS Execution Command when restarting a process.
      It might be filled with content. Press the button to insert this recommendation.
      Always double check this execution command.`,
    workingDirectory: `Shows the file system directory of the process.
      Some processes don't contain the absolute path to their execution artifact.
      Therefore, this attribute might be a hint on how to start a process.`,
  };

  @computed('args.procezz.workingDirectory')
  get workingDirectory() {
    const { workingDirectory } = this.args.procezz;

    const fallbackString = '<font color="red"><b>ATTENTION</b></font>: '
      + 'Working Directory could not be found. Check if execution path looks '
      + 'valid.';

    const htmlString = htmlSafe(fallbackString);

    const decisionFlag = workingDirectory !== null && workingDirectory.length > 0;

    return decisionFlag ? workingDirectory : htmlString;
  }

  @action
  public setUserExec() {
    const proposedExec = this.args.procezz.proposedExecutionCommand;
    const decisionMakerString = 'Use-OS-Exec-CMD';

    if (proposedExec === decisionMakerString) {
      set(this.args.procezz, 'userExecutionCommand', this.args.procezz.osExecutionCommand);
    } else {
      set(this.args.procezz, 'userExecutionCommand', proposedExec);
    }
  }
}
