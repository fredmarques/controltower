import html from 'choo/html';
import messages from '../../locales/ptBr';
import { formClasses, view } from '../views/botSetup';
import mutedBotListFormComponent from '../components/mutedBotListForm';

export default (state, send) => {
    const headers = ['Name'];
    const selectedRows = state.ui.selectedMutedUsers;
    const dataSet = state.users.filteredByMutedBot.map(user => ([
        user.name
    ]));
    const classes = formClasses;
    const onRowSelected = rowIndex => send('ui:selectMutedUser', rowIndex);
    const onRowDeselected = rowIndex => send('ui:deselectMutedUser', rowIndex);
    const onSubmit = e => {
        e.preventDefault();
        const selectedUsers = state.users.filteredByMutedBot.filter(
            (item, index) => selectedRows.includes(index)
        );
        send('api:unMuteChats', {
            ids: selectedUsers.map(item => item.id),
            botId: state.bot.id
        });
    };
    const onRefreshClick = e => {
        e.preventDefault();
        return send('api:getMutedChats', state.bot);
    };

    const content = mutedBotListFormComponent(
        headers,
        dataSet,
        selectedRows,
        state.api.updatingUsers,
        classes,
        messages.mutedChats.list,
        onRowSelected,
        onRowDeselected,
        onSubmit
    );
    const navbarRightContent = html`
<div class="navbar_right">
    <button
        class="btn btn-primary"
        ${state.api.updatingUsers ? 'disabled' : ''}
        onclick=${onRefreshClick}
    >
        <i class="fa fa-repeat"></i>
    </button>
</div>
    `;
    return view(content, {
        title: messages.mutedChats.title,
        subtitle: messages.mutedChats.list.title,
        description: messages.channels.facebook.description.trackOrder
    }, navbarRightContent);
};
