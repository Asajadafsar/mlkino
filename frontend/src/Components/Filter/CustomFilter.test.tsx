import {fireEvent, render, screen} from '@testing-library/react'
import {CustomFilter} from './CustomFilter'

test('text filters read and update the query parameter at the configured field key', () => {
    let next: any
    const setParams: any = (update: any) => {next = update({search: 'old'})}
    render(<CustomFilter filtersData={[{field: 'search', label: 'جستجو', type: 'text'}]} params={{filter: {}, search: 'old'} as any} setParams={setParams}/>)
    const input = screen.getByLabelText('جستجو')
    expect((input as HTMLInputElement).value).toBe('old')
    fireEvent.change(input, {target: {value: 'خانه'}})
    expect(next.search).toBe('خانه')
})
