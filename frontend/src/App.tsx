import { useState } from 'react'
import { Button } from './components/ui/Button'
import { Input } from './components/ui/Input'
import { NumberInput } from './components/ui/NumberInput'
import { Select } from './components/ui/Select'
import { Slider } from './components/ui/Slider'
import { Checkbox } from './components/ui/Checkbox'
import { Toggle } from './components/ui/Toggle'
import { Label } from './components/ui/Label'
import { SectionHeader } from './components/ui/SectionHeader'
import { Divider } from './components/ui/Divider'
import { Badge } from './components/ui/Badge'
import { Tooltip } from './components/ui/Tooltip'
import { Panel } from './components/ui/Panel'
import { Tabs } from './components/ui/Tabs'
import { LoadingState } from './components/ui/LoadingState'
import { EmptyState } from './components/ui/EmptyState'
import { ErrorState } from './components/ui/ErrorState'
import { ScientificValue, StatusValue, ProgressLabel } from './components/ui/ScientificValue'

function App() {
  const [density, setDensity] = useState<number | ''>(0.15)
  const [budget, setBudget] = useState(50)
  const [checked, setChecked] = useState(true)
  const [toggled, setToggled] = useState(false)
  const [tab, setTab] = useState('design')

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-10">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          Nanowire Design Optimizer — Design System
        </h1>
       
      </header>

      <Panel>
        <SectionHeader
          title="Buttons"
          action={<Badge tone="accent">Preview</Badge>}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Run Optimization</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Reset</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Inputs" />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="text-input">Design Label</Label>
            <Input id="text-input" placeholder="e.g. Sample A" />
          </div>
          <div>
            <Label htmlFor="density">Nanowire Density</Label>
            <NumberInput
              id="density"
              value={density}
              onChange={setDensity}
              unit="μm⁻²"
            />
            {/* <HelperText>Typical range: 0.02 – 0.30 μm⁻²</HelperText> */}
          </div>
          <div>
            <Label htmlFor="objective">Objective</Label>
            <Select
              id="objective"
              options={[
                { label: 'Minimize Sheet Resistance', value: 'sheet_resistance' },
                { label: 'Maximize Transparency', value: 'transparency' },
                { label: 'Maximize Strain Tolerance', value: 'strain_tolerance' },
              ]}
            />
          </div>
          <div>
            <Label>Optimization Budget</Label>
            <Slider value={budget} min={10} max={200} step={10} unit="simulations" onChange={(e) => setBudget(Number(e.target.value))} />
          </div>
        </div>
        <Divider className="my-6" />
        <div className="flex items-center gap-6">
          <Checkbox id="chk" label="Include strain tolerance" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <Toggle checked={toggled} onChange={setToggled} label="Live preview" />
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Tabs" />
        <Tabs
          items={[
            { label: 'Design Space', value: 'design' },
            { label: 'Constraints', value: 'constraints' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </Panel>

      <Panel>
        <SectionHeader title="Scientific UI Conventions" />
        <div className="grid grid-cols-4 gap-6">
          <ScientificValue label="Nanowire Density" value="18.4" unit="μm⁻²" />
          <ScientificValue label="Maximum Sheet Resistance" value="≤ 20" unit="Ω/sq" />
          <StatusValue label="Spanning Cluster" status={true} />
          <ProgressLabel current={47} total={100} />
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Badges" />
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">Pending</Badge>
          <Badge tone="success">Feasible</Badge>
          <Badge tone="warning">Uncertain</Badge>
          <Badge tone="danger">Constraint Violated</Badge>
          <Badge tone="accent">Optimizing</Badge>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Tooltip" />
        <Tooltip content="Fraction of film area that transmits light">
          <span className="text-sm text-foreground underline decoration-dotted cursor-help">
            Transparency
          </span>
        </Tooltip>
      </Panel>

      <Panel>
        <SectionHeader title="Loading / Empty / Error States" />
        <div className="grid grid-cols-3 divide-x divide-border">
          <LoadingState label="Running simulation 34 of 100" />
          <EmptyState title="No designs found" description="Adjust constraints and try again." />
          <ErrorState title="Optimization failed" description="No percolating design found." />
        </div>
      </Panel>
    </div>
  )
}

export default App