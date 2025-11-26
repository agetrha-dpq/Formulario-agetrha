// URL do Google Apps Script
const GAS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQiT1azwadu1QljcSpr2LHelNp3zMDTh_pfKyzoHYHEUZruxXqtenoX4WxtZ0YQf3g6Q/exec';

// Dados do organograma - SEM LOCALSTORAGE
let organograma = {};
let cargoAtual = '';
let listaMembros = [];
let fotoTemp = null;

// Função para mostrar mensagens de status
function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// SOLUÇÃO: Função para carregar membros com tratamento de erro melhorado
async function carregarMembros() {
    try {
        console.log('📋 Carregando membros...');
        document.getElementById('loading-membros').style.display = 'block';
        
        // Tentar carregar do GAS
        const url = `${GAS_SCRIPT_URL}?action=getMembers&t=${Date.now()}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.members) {
                listaMembros = result.members;
                console.log(`✅ ${listaMembros.length} membros carregados do GAS`);
            } else {
                throw new Error('Falha ao carregar membros do GAS');
            }
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        atualizarDropdownNomes();
        document.getElementById('loading-membros').style.display = 'none';
        
        return listaMembros;
    } catch (error) {
        console.error('❌ Erro ao carregar membros:', error);
        document.getElementById('loading-membros').style.display = 'none';
        
        // Usar dados de fallback
        listaMembros = [
            { numeroMembro: '001', nome: 'GERALDINA FRANCISCO' },
            { numeroMembro: '002', nome: 'UMBELINO CLEMENTE' },
            { numeroMembro: '003', nome: 'JEREMIAS JERÔNIMO' }
        ];
        
        atualizarDropdownNomes();
        showStatus('Erro ao carregar membros do servidor', 'error');
        return listaMembros;
    }
}

// Função para atualizar o dropdown de nomes
function atualizarDropdownNomes() {
    const selectNome = document.getElementById('nome-cargo');
    
    if (!selectNome) return;
    
    const selecaoAtual = selectNome.value;
    
    // Limpar opções existentes (exceto a primeira)
    while (selectNome.children.length > 1) {
        selectNome.removeChild(selectNome.lastChild);
    }
    
    // Adicionar membros à lista
    listaMembros.forEach(membro => {
        if (membro.nome && membro.nome.trim() !== '') {
            const option = document.createElement('option');
            option.value = membro.nome;
            option.textContent = membro.nome;
            option.setAttribute('data-numero-membro', membro.numeroMembro || '');
            selectNome.appendChild(option);
        }
    });
    
    // Restaurar seleção anterior se possível
    if (selecaoAtual) {
        selectNome.value = selecaoAtual;
    }
    
    console.log(`✅ Dropdown atualizado com ${listaMembros.length} membros`);
}

// Função para voltar ao organograma
function voltarAoOrganograma() {
    document.getElementById('organograma-content').style.display = 'block';
    document.getElementById('chefes-content').style.display = 'none';
}

// SOLUÇÃO: Carregar foto da presidente corretamente
function loadPresidentPhoto() {
    const img = document.getElementById('presidentPhoto');
    if (!img) return;
    
    const presidente = organograma['presidente-nacional'];
    console.log('📸 Dados da presidente:', presidente); // DEBUG
    
    if (presidente && presidente.foto) {
        img.src = presidente.foto;
        img.classList.remove('placeholder');
        img.innerHTML = '';
        console.log('✅ Foto da presidente carregada:', presidente.foto);
    } else {
        // Se não há foto salva, usar placeholder
        img.src = '';
        img.classList.add('placeholder');
        img.innerHTML = '?';
        console.log('ℹ️ Sem foto para a presidente');
    }
}

// SOLUÇÃO: Carregar dados do organograma do GAS com fallback
async function carregarOrganogramaDoGAS() {
    try {
        console.log('🔄 Carregando organograma do GAS...');
        
        // Tentar carregar do GAS
        const url = `${GAS_SCRIPT_URL}?action=getOrganogramaData&t=${Date.now()}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const result = await response.json();
            console.log('📊 Resposta do GAS:', result); // DEBUG
            
            if (result.success) {
                // Processar os dados do organograma
                if (result.cargos && result.fotos) {
                    organograma = {};
                    
                    Object.keys(result.cargos).forEach(cargoId => {
                        const cargo = result.cargos[cargoId];
                        organograma[cargoId] = {
                            nome: cargo.nomeCompleto || '',
                            numeroMembro: cargo.numeroMembro || '',
                            foto: result.fotos[cargoId] || null
                        };
                    });
                    
                    console.log('✅ Organograma carregado do GAS');
                    console.log('📋 Dados do organograma:', organograma); // DEBUG
                } else {
                    console.warn('⚠️ Estrutura de dados inesperada do GAS');
                    // Usar dados de fallback
                    organograma = criarOrganogramaVazio();
                }
            } else {
                throw new Error('Falha ao carregar organograma do GAS: ' + (result.error || 'Erro desconhecido'));
            }
        } else {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar organograma do GAS:', error);
        // Usar dados de fallback
        organograma = criarOrganogramaVazio();
        showStatus('Erro ao carregar organograma do servidor', 'error');
    }
    
    // Carregar a interface independentemente do resultado
    carregarOrganogramaNaInterface();
    loadPresidentPhoto();
}

// SOLUÇÃO: Criar organograma vazio como fallback
function criarOrganogramaVazio() {
    const organogramaVazio = {};
    
    // Lista de todos os cargos possíveis
    const cargos = [
        'presidente-assembleia', 'primeiro-vogal-assembleia', 'segundo-vogal-assembleia',
        'presidente-nacional', 'vice-presidente-nacional', 'secretario-presidencia',
        'primeiro-secretario', 'segundo-secretario', 'presidente-fiscal',
        'secretario-fiscal', 'primeiro-vogal-fiscal', 'segundo-vogal-fiscal',
        'primeiro-conselheiro', 'segundo-conselheiro'
    ];
    
    // Inicializar todos os cargos como vazios
    cargos.forEach(cargoId => {
        organogramaVazio[cargoId] = {
            nome: '',
            numeroMembro: '',
            foto: null
        };
    });
    
    return organogramaVazio;
}

// SOLUÇÃO: Carregar dados do organograma na interface
function carregarOrganogramaNaInterface() {
    console.log('🎨 Carregando organograma na interface...');
    
    const cartoes = document.querySelectorAll('.org-card');
    
    cartoes.forEach(cartao => {
        const posicao = cartao.getAttribute('data-position');
        const dados = organograma[posicao] || {};
        const img = cartao.querySelector('.org-photo');
        
        // Atualizar foto
        if (dados.foto) {
            img.src = dados.foto;
            img.onerror = function() {
                this.src = '';
                this.classList.add('placeholder');
                this.innerHTML = '?';
            };
            img.onload = function() {
                this.classList.remove('placeholder');
            };
            img.classList.remove('placeholder');
            img.innerHTML = '';
        } else {
            img.src = '';
            img.classList.add('placeholder');
            img.innerHTML = '?';
        }
        
        // Atualizar nome
        const nomeElement = cartao.querySelector('.org-name');
        if (dados.nome) {
            nomeElement.textContent = dados.nome;
            cartao.classList.remove('vaga');
        } else {
            nomeElement.textContent = 'Vaga disponível';
            cartao.classList.add('vaga');
        }
        
        // Atualizar número do membro
        const numeroElement = cartao.querySelector('.member-id');
        if (dados.numeroMembro) {
            numeroElement.textContent = dados.numeroMembro;
        } else {
            numeroElement.textContent = '---';
        }
    });
}

// Função para editar cargo
function editarCargo(posicao) {
    cargoAtual = posicao;
    const dados = organograma[posicao] || {};
    const cartao = document.querySelector(`[data-position="${posicao}"]`);
    const cargoNome = cartao.querySelector('.org-position').textContent;
    
    document.getElementById('modal-titulo-cargo').textContent = `Editar ${cargoNome}`;
    document.getElementById('cargo').value = cargoNome;
    
    fotoTemp = null;
    document.getElementById('foto-input').value = '';
    document.getElementById('file-name').textContent = 'Nenhum ficheiro selecionado';
    
    const photoPreview = document.getElementById('photo-preview');
    if (dados.foto) {
        photoPreview.src = dados.foto;
        photoPreview.classList.remove('placeholder');
    } else {
        photoPreview.src = '';
        photoPreview.classList.add('placeholder');
        photoPreview.innerHTML = '?';
    }
    
    document.getElementById('nome-cargo').value = dados.nome || '';
    document.getElementById('numero-membro-cargo').value = dados.numeroMembro || '';
    
    if (listaMembros.length === 0) {
        carregarMembros();
    } else {
        atualizarDropdownNomes();
    }
    
    document.getElementById('modal-cargo').style.display = 'flex';
}

// SOLUÇÃO: Salvar cargo usando FormData para evitar problemas de CORS
async function salvarCargo() {
    const nome = document.getElementById('nome-cargo').value;
    const numeroMembro = document.getElementById('numero-membro-cargo').value;
    
    if (!nome.trim()) {
        alert('O nome é obrigatório!');
        return;
    }
    
    // Se há uma nova foto, fazer upload primeiro
    if (fotoTemp !== null) {
        try {
            // Extrair apenas a parte base64 do data URL
            const base64Data = fotoTemp.replace(/^data:image\/\w+;base64,/, '');
            
            // Criar FormData para upload da foto
            const formDataFoto = new FormData();
            formDataFoto.append('action', 'uploadFoto');
            formDataFoto.append('cargoId', cargoAtual);
            formDataFoto.append('imageData', base64Data);
            
            // Enviar requisição POST para upload da foto
            const responseFoto = await fetch(GAS_SCRIPT_URL, {
                method: 'POST',
                body: formDataFoto,
                mode: 'no-cors'
            });
            
            console.log('✅ Foto enviada para o servidor');
            showStatus('Foto enviada para o servidor');
        } catch (error) {
            console.error('❌ Erro ao fazer upload da foto:', error);
            showStatus('Erro ao enviar foto para o servidor', 'error');
            return;
        }
    }
    
    // Atualizar o cargo no GAS
    try {
        // Criar FormData para atualizar o cargo
        const formDataCargo = new FormData();
        formDataCargo.append('action', 'updateCargo');
        formDataCargo.append('cargoId', cargoAtual);
        formDataCargo.append('nomeCompleto', nome);
        formDataCargo.append('numeroMembro', numeroMembro);
        
        // Enviar requisição POST para atualizar o cargo
        const responseCargo = await fetch(GAS_SCRIPT_URL, {
            method: 'POST',
            body: formDataCargo,
            mode: 'no-cors'
        });
        
        console.log('✅ Cargo atualizado no GAS');
        
        // Atualizar dados locais em memória (não no localStorage)
        organograma[cargoAtual] = {
            nome: nome,
            numeroMembro: numeroMembro,
            foto: fotoTemp !== null ? fotoTemp : (organograma[cargoAtual] ? organograma[cargoAtual].foto : null)
        };
        
        // Recarregar dados do GAS para garantir sincronização
        await carregarOrganogramaDoGAS();
        
        showStatus('Cargo atualizado com sucesso!');
        fecharModalCargo();
    } catch (error) {
        console.error('❌ Erro ao atualizar cargo no GAS:', error);
        showStatus('Erro ao atualizar cargo no servidor', 'error');
    }
}

// Função para fechar modal do cargo
function fecharModalCargo() {
    document.getElementById('modal-cargo').style.display = 'none';
    fotoTemp = null;
}

// SOLUÇÃO: Sincronizar dados com o GAS
async function sincronizarDados() {
    try {
        showStatus('Sincronizando dados com o servidor...', 'warning');
        
        // Recarregar todos os dados do GAS
        await carregarMembros();
        await carregarOrganogramaDoGAS();
        
        showStatus('Dados sincronizados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error);
        showStatus('Erro na sincronização com o servidor', 'error');
    }
}

// SOLUÇÃO: Carregar departamentos com dados reais
function carregarDepartamentos() {
    const container = document.getElementById('departamentos-container');
    
    // Dados dos departamentos
    const departamentos = [
        { 
            nome: 'DEPARTAMENTO FINANCEIRO', 
            cargos: [
                { nome: 'Diretor Financeiro', id: 'diretor-financeiro' },
                { nome: 'Contador Chefe', id: 'contador-chefe' },
                { nome: 'Assistente Financeiro', id: 'assistente-financeiro' }
            ] 
        },
        { 
            nome: 'DEPARTAMENTO DE RECURSOS HUMANOS', 
            cargos: [
                { nome: 'Diretor de RH', id: 'diretor-rh' },
                { nome: 'Recrutador Sênior', id: 'recrutador-senior' },
                { nome: 'Especialista em Treinamento', id: 'especialista-treinamento' }
            ] 
        },
        { 
            nome: 'DEPARTAMENTO TÉCNICO', 
            cargos: [
                { nome: 'Diretor Técnico', id: 'diretor-tecnico' },
                { nome: 'Engenheiro Sênior', id: 'engenheiro-senior' },
                { nome: 'Técnico Especializado', id: 'tecnico-especializado' }
            ] 
        },
        { 
            nome: 'DEPARTAMENTO COMERCIAL', 
            cargos: [
                { nome: 'Diretor Comercial', id: 'diretor-comercial' },
                { nome: 'Gerente de Vendas', id: 'gerente-vendas' },
                { nome: 'Representante Comercial', id: 'representante-comercial' }
            ] 
        }
    ];
    
    let html = '';
    
    departamentos.forEach(dept => {
        html += `
            <div class="org-section-title">${dept.nome}</div>
            <div class="org-level">
        `;
        
        dept.cargos.forEach(cargo => {
            html += `
                <div class="org-card" data-position="${cargo.id}">
                    <img class="org-photo placeholder" src="" alt="">
                    <div class="org-name">${cargo.nome}</div>
                    <div class="org-position">${cargo.nome}</div>
                    <div class="org-member-id">Nº: <span class="member-id">---</span></div>
                    <div class="org-actions">
                        <button class="org-action-btn edit" onclick="editarCargo('${cargo.id}')"><i class="fas fa-edit"></i></button>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    container.innerHTML = html;
    
    // Carregar dados dos departamentos no organograma
    const cartoesDepartamentos = container.querySelectorAll('.org-card');
    cartoesDepartamentos.forEach(cartao => {
        const posicao = cartao.getAttribute('data-position');
        const dados = organograma[posicao] || {};
        const img = cartao.querySelector('.org-photo');
        
        if (dados.foto) {
            img.src = dados.foto;
            img.classList.remove('placeholder');
        } else {
            img.src = '';
            img.classList.add('placeholder');
            img.innerHTML = '?';
        }
        
        const nomeElement = cartao.querySelector('.org-name');
        if (dados.nome) {
            nomeElement.textContent = dados.nome;
            cartao.classList.remove('vaga');
        } else {
            nomeElement.textContent = cartao.querySelector('.org-position').textContent;
            cartao.classList.add('vaga');
        }
        
        const numeroElement = cartao.querySelector('.member-id');
        if (dados.numeroMembro) {
            numeroElement.textContent = dados.numeroMembro;
        } else {
            numeroElement.textContent = '---';
        }
    });
}

// SOLUÇÃO: Carregar página de chefes
function carregarChefes() {
    const chefesGrid = document.getElementById('chefes-grid');
    
    // Filtrar apenas os cargos que estão preenchidos
    const chefes = Object.keys(organograma)
        .filter(posicao => organograma[posicao].nome && organograma[posicao].nome.trim() !== '')
        .map(posicao => {
            const cargo = organograma[posicao];
            const cartao = document.querySelector(`[data-position="${posicao}"]`);
            const cargoNome = cartao ? cartao.querySelector('.org-position').textContent : posicao;
            
            return {
                posicao,
                nome: cargo.nome,
                cargo: cargoNome,
                numeroMembro: cargo.numeroMembro,
                foto: cargo.foto
            };
        });
    
    if (chefes.length === 0) {
        chefesGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--gray);">Nenhum cargo preenchido no organograma</p>';
        return;
    }
    
    let html = '';
    
    chefes.forEach(chefe => {
        html += `
            <div class="chefe-card">
                ${chefe.foto ? 
                    `<img src="${chefe.foto}" class="chefe-photo" alt="${chefe.nome}">` : 
                    `<div class="chefe-photo placeholder">?</div>`
                }
                <div class="chefe-nome">${chefe.nome}</div>
                <div class="chefe-cargo">${chefe.cargo}</div>
                <div class="chefe-id">Nº: ${chefe.numeroMembro || '---'}</div>
            </div>
        `;
    });
    
    chefesGrid.innerHTML = html;
}

// Função para lidar com a seleção de arquivo
function setupFileInput() {
    const fileInput = document.getElementById('foto-input');
    const fileNameDisplay = document.getElementById('file-name');
    const photoPreview = document.getElementById('photo-preview');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                alert('Por favor, selecione um arquivo de imagem.');
                fileInput.value = '';
                fileNameDisplay.textContent = 'Nenhum ficheiro selecionado';
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('A imagem é muito grande. Por favor, selecione uma imagem menor que 5MB.');
                fileInput.value = '';
                fileNameDisplay.textContent = 'Nenhum ficheiro selecionado';
                return;
            }
            
            fileNameDisplay.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataURL = e.target.result;
                fotoTemp = dataURL;
                
                photoPreview.src = dataURL;
                photoPreview.classList.remove('placeholder');
                photoPreview.innerHTML = '';
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = 'Nenhum ficheiro selecionado';
            fotoTemp = null;
            
            const dados = organograma[cargoAtual] || {};
            if (dados.foto) {
                photoPreview.src = dados.foto;
                photoPreview.classList.remove('placeholder');
            } else {
                photoPreview.src = '';
                photoPreview.classList.add('placeholder');
                photoPreview.innerHTML = '?';
            }
        }
    });
}

// Função para atualizar o número de membro
function atualizarNumeroMembro() {
    const selectNome = document.getElementById('nome-cargo');
    const inputNumeroMembro = document.getElementById('numero-membro-cargo');
    
    const nomeSelecionado = selectNome.value;
    const optionSelecionada = selectNome.options[selectNome.selectedIndex];
    const numeroMembro = optionSelecionada.getAttribute('data-numero-membro') || '';
    
    inputNumeroMembro.value = numeroMembro;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando aplicação AGETRHA...');
    
    // Configurar event listeners
    document.getElementById('btn-fechar-modal-cargo').addEventListener('click', fecharModalCargo);
    document.getElementById('btn-cancelar-cargo').addEventListener('click', fecharModalCargo);
    document.getElementById('btn-salvar-cargo').addEventListener('click', salvarCargo);
    document.getElementById('btn-exportar-organograma').addEventListener('click', exportarOrganograma);
    document.getElementById('btn-adicionar-cargo').addEventListener('click', abrirModalNovoCargo);
    document.getElementById('btn-ver-chefes').addEventListener('click', verTodosChefes);
    document.getElementById('btn-voltar-organograma').addEventListener('click', voltarAoOrganograma);
    document.getElementById('btn-ver-departamentos').addEventListener('click', toggleDepartamentos);
    document.getElementById('btn-sincronizar').addEventListener('click', sincronizarDados);
    document.getElementById('nome-cargo').addEventListener('change', atualizarNumeroMembro);
    
    // Configurar o input de arquivo
    setupFileInput();
    
    // Carregar dados iniciais
    try {
        await carregarMembros();
        await carregarOrganogramaDoGAS();
        showStatus('Dados carregados do servidor com sucesso!');
    } catch (erro) {
        console.warn('⚠️ Erro ao carregar dados do servidor:', erro);
        showStatus('Erro ao carregar dados do servidor', 'error');
    }
    
    console.log('✅ Aplicação AGETRHA carregada com sucesso!');
});

// Funções globais
window.editarCargo = editarCargo;
window.verTodosChefes = function() {
    document.getElementById('organograma-content').style.display = 'none';
    document.getElementById('chefes-content').style.display = 'block';
    carregarChefes();
};
window.abrirModalNovoCargo = function() {
    alert('Funcionalidade de adicionar novo cargo será implementada em breve.');
};
window.exportarOrganograma = function() {
    // Usar html2canvas para capturar o organograma
    html2canvas(document.querySelector('.organograma-container')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save('organograma-agetrha.pdf');
        showStatus('Organograma exportado com sucesso!');
    });
};
window.toggleDepartamentos = function() {
    const container = document.getElementById('departamentos-container');
    const btn = document.getElementById('btn-ver-departamentos');
    
    if (container.style.display === 'none') {
        // Carregar departamentos quando forem exibidos pela primeira vez
        if (container.innerHTML.trim() === '') {
            carregarDepartamentos();
        }
        container.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> OCULTAR DEPARTAMENTOS';
    } else {
        container.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> VER DEPARTAMENTOS';
    }
};
window.carregarChefes = carregarChefes;
