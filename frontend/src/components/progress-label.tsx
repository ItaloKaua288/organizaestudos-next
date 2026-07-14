'use client'

import { Field, FieldDescription } from '@/components/ui/field'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'

type ProgressLabelDemoProps = {
    value?: number;
    displayValue?: string;
    label?: string;
    description?: string;
};

const ProgressLabelDemo = ({ value, displayValue, label, description }: ProgressLabelDemoProps) => {
    return (
        <div className='flex w-full flex-col gap-4 border border-border rounded-md p-2'>
            <Field>
                <Progress value={value ?? 0} className='transition-all duration-300'>
                    <ProgressLabel>{label || "Exemple label"}</ProgressLabel>
                    {displayValue ? (
                        <ProgressValue className='text-foreground font-medium'>{() => displayValue}</ProgressValue>
                    ) : (
                        <ProgressValue className='text-foreground font-medium'/>
                    )}
                </Progress>
                {displayValue
                    ? `${displayValue} ${description ?? ""}`
                    : `${value ?? 0}% ${description ?? ""}`
                }
            </Field>
        </div>
    )
}

export default ProgressLabelDemo
