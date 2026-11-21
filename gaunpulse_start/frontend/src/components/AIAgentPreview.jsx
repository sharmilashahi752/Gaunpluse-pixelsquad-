import { ArrowRight, Bot, LockKeyhole, Sparkles } from 'lucide-react';
import { Card, DemoLabel } from './ui';

export default function AIAgentPreview({ onOpenAgent }) {
  return (
    <Card className="agent-preview">
      <div className="agent-preview__head">
        <span className="agent-preview__icon"><Bot size={22} aria-hidden="true" /></span>
        <div><strong>GaunPulse AI Agent</strong><span>Interface preview</span></div>
        <span className="online-dot">UI demo</span>
      </div>
      <div className="agent-preview__message">
        <Sparkles size={17} aria-hidden="true" />
        <p>“Which disruption should the municipality review first today?”</p>
      </div>
      <p className="agent-preview__answer">The future agent will summarize verified evidence and explain its sources. No AI model is connected in Part 2.</p>
      <div className="agent-preview__footer">
        <span><LockKeyhole size={13} /> Human review required</span>
        <button className="text-button" type="button" onClick={onOpenAgent}>Open UI demo <ArrowRight size={15} /></button>
      </div>
      <DemoLabel compact />
    </Card>
  );
}
