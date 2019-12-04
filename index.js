/* @flow */

/*::
type FlowReport = {
  flowVersion: string,
  errors: ErrorReport[],
};

type ErrorReport = {
  kind: 'infer' | 'parse' | string,
  level: 'error' | 'warning',
  suppressions: any[],
  message: Message[],
  extra?: ExtraReport[],
};

type ExtraReport = {
  message: Message[],
  children?: ExtraReport[],
}

type Message = BlameMessage | CommentMessage;

type BlameMessage = {
  type: 'Blame',
  descr: string,
  context: string,
  line: number,
  endline: number,
  path: string,
  start: number,
  end: number,
};

type CommentMessage = {
  type: 'Comment',
  descr: string,
  context: null,
  line: number,
  endline: number,
  path: string,
  start: number,
  end: number,
}
*/

function errorToString(error /*: ErrorReport */) /*: string */ {
  const title = error.message.map(message => message.descr).join(' ');
  let message = `Error: ${title}

${error.message.map(messageToString).join('\n\n')}`;
  if (error.extra) {
    message += '\n\nExtra information - ';
    message += error.extra.map(extraToString).join('\n');
  }
  return message;
}

function extraToString(extra /*: ExtraReport */) /*: string */ {
  let message = extra.message.map(messageToString).join('\n\n');
  if (extra.children) {
    return message + '\n\n' + extra.children.map(extraToString).join('\n\n');
  }
  return message;
}

function messageToString(message /*: Message */) /*: string */ {
  if (message.context !== null) {
    return blameToString(message);
  }
  return commentToString(message);
}

function blameToString(blame /*: BlameMessage */) /*: string */ {
  const path = `${blame.path}:${blame.line}`;
  let location = '';
  if ((blame.context, blame.end - blame.start + 1 > 0)) {
    location = '^'.repeat(blame.end - blame.start + 1);
  }
  return (
    path + '\n' + blame.context + '\n' + ' '.repeat(Math.max(0, blame.start - 1)) + location + ' ' + blame.descr
  );
}

function commentToString(comment /*: CommentMessage */) /*: string */ {
  return comment.descr;
}

function parseErrors(errors /* Array[ErrorReport] */) /*: Array[string] */ {
  return errors.map(error => {
    const path = error.message[0].path;
    const title = error.message.map(message => message.descr).join(' ');
    const message = errorToString(error);
    return `
    <testcase
      time="0"
      classname="${path}"
      id="flow-error"
      name="${path}"
    >
      <failure
        type="${error.level.toUpperCase()}"
        message="${title}"
      >
        <![CDATA[
${message}
        ]]>
      </failure>
    </testcase>`;
  });
}

module.exports = function flowJUnitTransformer(input /*: FlowReport */) {
  let testcase = [];
  if (input.passed) {
    testcase.push(`
    <testcase
      time="0"
      classname="flow"
      id="flow-success"
      name="flow"
    >
    </testcase>`);
  } else {
    testcase = parseErrors(input.errors);
  }
  return `<?xml version="1.0" encoding="UTF-8" ?>
<testsuites id="flow">
  <testsuite
    package="org.flow"
    tests="${testcase.length}"
    time="0"
    skipped="0"
    errors="${testcase.length}"
    id="flow-suite"
    name="Flow type check"
  >${testcase.join('')}
  </testsuite>
</testsuites>
`;
};
