"""Shared bounded pagination and model-specific SQL search for scoped workflows."""
from django.db.models import Q
from rest_framework.exceptions import ValidationError

SEARCH={
 'crmcontact':('name','phone'),
 'propertyreferral':('property__data__title','property__data__city','expert__first_name','expert__last_name'),
 'propertyfavorite':('property__data__title','property__data__city','property__data__neighborhood'),
 'visitslot':('property__data__title','property__data__city'),
 'propertyvisit':('slot__property__data__title','visitor__first_name','visitor__last_name'),
 'propertyoffer':('message','property__data__title','request__data__title'),
 'financialdocument':('description','data__tracking_number','party__name','party__phone'),
}
def filtered(qs,request):
    search=request.query_params.get('search','').strip()
    if len(search)>200:raise ValidationError('متن جستجو حداکثر ۲۰۰ حرف باشد.')
    if search:
        condition=Q()
        for field in SEARCH.get(qs.model._meta.model_name,()):condition|=Q(**{field+'__icontains':search})
        if condition:qs=qs.filter(condition)
    status=request.query_params.get('status')
    if status and 'status' in {f.name for f in qs.model._meta.fields}:qs=qs.filter(status=status)
    if not qs.ordered:qs=qs.order_by('-pk')
    return qs

def paginate(rows,request,serializer=lambda row:row):
    try:
        page=int(request.query_params.get('page',1));size=int(request.query_params.get('page_size',24))
        if page<1 or not 1<=size<=100:raise ValueError()
    except (ValueError,TypeError):raise ValidationError('صفحه مثبت و تعداد هر صفحه بین ۱ تا ۱۰۰ باشد.')
    count=len(rows) if isinstance(rows,(list,tuple)) else rows.count()
    return {'results':[serializer(row) for row in rows[(page-1)*size:page*size]],'total_results':count,'page':page,'page_size':size,'has_more':page*size<count}
