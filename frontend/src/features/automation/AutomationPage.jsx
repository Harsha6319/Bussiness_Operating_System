import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiClock, FiMail, FiZap } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { date } from '../../utils/format.js';

const workflows = [
  { icon: FiBell, title: 'Low stock notification', trigger: 'Product stock reaches threshold', status: 'Ready' },
  { icon: FiMail, title: 'Daily business summary', trigger: 'Every day at 8:00 AM', status: 'Ready' },
  { icon: FiClock, title: 'Invoice reminder', trigger: 'Invoice remains unpaid for 7 days', status: 'Ready' }
];

export function AutomationPage() {
  const queryClient = useQueryClient();
  const { data: logs } = useQuery({ queryKey: ['workflow-logs'], queryFn: () => endpoints.ai.workflowLogs().then((res) => res.data.data) });
  const { data: tasks } = useQuery({ queryKey: ['agent-tasks'], queryFn: () => endpoints.ai.agentTasks().then((res) => res.data.data) });
  const runAgent = useMutation({
    mutationFn: endpoints.ai.runAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-logs'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
    }
  });

  return (
    <div className="page-shell">
      <PageHeader title="Automation" description="Agent workflows for low stock, large expenses, order operations, and future multi-agent systems." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="Active Agents" value="3" icon={FiZap} />
        <Card title="Workflow Runs" value={logs?.length || 0} icon={FiBell} tone="emerald" />
        <Card title="Pending Tasks" value={tasks?.filter((task) => task.status === 'Pending').length || 0} icon={FiClock} tone="amber" />
      </div>
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <div className="panel flex items-center justify-between gap-4 p-5" key={workflow.title}>
            <div className="flex items-center gap-4">
              <span className="rounded-lg bg-brand-50 p-3 text-brand-700"><workflow.icon /></span>
              <div>
                <p className="font-semibold text-slate-950">{workflow.title}</p>
                <p className="text-sm text-slate-500">{workflow.trigger}</p>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => runAgent.mutate({ workflow: workflow.title.toLowerCase().includes('low') ? 'low-stock' : workflow.title.toLowerCase().includes('expense') ? 'large-expense' : 'new-order' })}>{workflow.status}</button>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DataTable columns={[
          { key: 'workflow', label: 'Workflow' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Run At', render: (row) => date(row.createdAt) }
        ]} rows={logs || []} empty="Run an agent workflow to see execution logs." />
        <DataTable columns={[
          { key: 'agent', label: 'Agent' },
          { key: 'taskType', label: 'Task' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Created', render: (row) => date(row.createdAt) }
        ]} rows={tasks || []} empty="Agent tasks will appear after workflows run." />
      </div>
    </div>
  );
}
