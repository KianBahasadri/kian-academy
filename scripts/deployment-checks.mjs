export function assertSafePlan(plan) {
  if (plan.errored || !Array.isArray(plan.resource_changes)) throw new Error('Terraform did not produce a valid plan.');
  for (const resource of plan.resource_changes) {
    if (resource.change.actions.includes('delete') && resource.address !== 'terraform_data.schema') throw new Error(`Deployment refused to delete or replace ${resource.address}.`);
    if (resource.type === 'cloudflare_workers_script') {
      const migration = resource.change.after?.migrations;
      for (const step of [migration, ...(migration?.steps ?? [])]) if (['deleted_classes', 'renamed_classes', 'transferred_classes'].some(field => step?.[field]?.length)) throw new Error('Deployment refused a destructive account coordinator migration.');
    }
  }
}

export function assertExistingState(state, expected) {
  const resources = state.resources?.filter(resource => resource.mode === 'managed') ?? [];
  for (const [address, id] of Object.entries(expected)) {
    const found = resources.find(resource => `${resource.type}.${resource.name}` === address);
    if (found?.instances?.length !== 1 || found.instances[0].attributes.id !== id) throw new Error(`Production state is missing the expected ${address}. Restore or import state before deploying.`);
  }
}
