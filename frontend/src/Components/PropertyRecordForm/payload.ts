export function recordPayload(values: Record<string, any>) {
 const {id,created_at,updated_at,...data}=values
 if(data.contractType !== 'رهن و اجاره'){delete data.monthlyCharge;delete data.monthlyChargeFrom;delete data.monthlyChargeTo}
 const files=(data.images || []).filter((image:any)=>image instanceof File)
 const payload={...data,images:(data.images || []).filter((image:any)=>typeof image==='string')}
 if(!files.length)return payload
 const form=new FormData();form.append('payload',JSON.stringify(payload));files.forEach((file:File)=>form.append('images',file));return form
}
