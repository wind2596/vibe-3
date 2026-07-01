from fastapi import APIRouter, HTTPException, Response, status

from app.schemas.member import MemberCreate, MemberItem, MemberUpdate
from app.services.member_service import create_member, delete_member, list_members, update_member

router = APIRouter()


@router.get('/members', response_model=list[MemberItem])
def get_members() -> list[MemberItem]:
    return [MemberItem(**item) for item in list_members()]


@router.post('/members', response_model=MemberItem, status_code=status.HTTP_201_CREATED)
def post_member(payload: MemberCreate) -> MemberItem:
    try:
        member = create_member(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MemberItem(**member)


@router.put('/members/{member_id}', response_model=MemberItem)
def put_member(member_id: int, payload: MemberUpdate) -> MemberItem:
    try:
        member = update_member(member_id, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        message = str(exc)
        code = status.HTTP_404_NOT_FOUND if 'not found' in message.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=message) from exc
    return MemberItem(**member)


@router.delete('/members/{member_id}', status_code=status.HTTP_204_NO_CONTENT)
def remove_member(member_id: int) -> Response:
    delete_member(member_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
