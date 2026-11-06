const users = [];

// KAYIT OL (REGISTER)
app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
  }

  const newUser = {
    id: `USR-${Date.now()}`,
    name: name || 'Yeni Kullanıcı',
    email,
    password, // Gerçek senaryoda bcrypt ile hash'lenir
    role: role || 'USER' // Varsayılan rol USER
  };

  users.push(newUser);
  console.log('[AUTH SERVICE] Yeni kullanıcı kaydoldu:', newUser.email);

  return res.status(201).json({
    message: 'Kayıt başarıyla gerçekleşti! Şimdi giriş yapabilirsiniz.',
    userId: newUser.id
  });
});